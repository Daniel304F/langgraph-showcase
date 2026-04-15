import json
import uuid
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv
from langgraph.types import Command

from graph import build_graph
from state import BlogState

load_dotenv()

app = FastAPI(title="LangGraph Blog Writer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()

NODE_OUTPUT_KEYS = {
    "plan_outline": "outline",
    "collect_sources": "sources",
    "draft_article": "draft",
    "review_draft": "approved",
    "revise_article": "revision_notes",
    "finalize": "final_article",
}

NODE_DESCRIPTIONS = {
    "plan_outline": "Erstellt die Gliederung für den Blogartikel",
    "collect_sources": "Sammelt Recherchequellen und eigene Links",
    "draft_article": "Schreibt bzw. überarbeitet den Artikel-Entwurf",
    "review_draft": "Nutzer-Review: Entwurf freigeben oder Feedback geben",
    "revise_article": "Übergang: leitet die Überarbeitung ein",
    "finalize": "Finale Fassung mit Titel, Meta-Description und Tags",
}

NODE_READS = {
    "plan_outline": ["topic", "audience", "revision_notes"],
    "collect_sources": ["topic", "outline", "sources"],
    "draft_article": ["topic", "audience", "outline", "sources", "revision_notes", "draft"],
    "review_draft": ["draft", "iteration"],
    "revise_article": ["revision_notes", "iteration"],
    "finalize": ["topic", "draft"],
}

NODE_WRITES = {
    "plan_outline": ["outline"],
    "collect_sources": ["sources"],
    "draft_article": ["draft"],
    "review_draft": ["approved", "iteration", "revision_notes"],
    "revise_article": [],
    "finalize": ["final_article"],
}

ALL_STATE_KEYS = [
    "topic", "audience", "outline", "sources", "draft",
    "revision_notes", "iteration", "approved", "final_article",
]

resume_store: dict[str, Any] = {}


class ResumeRequest(BaseModel):
    value: Any


class BlogRequest(BaseModel):
    topic: str
    audience: str = ""


def serialize_state(state: dict) -> dict:
    defaults = {
        "topic": "",
        "audience": "",
        "outline": [],
        "sources": [],
        "draft": "",
        "revision_notes": "",
        "iteration": 0,
        "approved": False,
        "final_article": "",
    }
    result = {}
    for key in ALL_STATE_KEYS:
        value = state.get(key, defaults.get(key))
        if isinstance(value, (str, int, float, bool)):
            result[key] = value
        elif isinstance(value, list):
            result[key] = [str(item) for item in value]
        else:
            result[key] = str(value)
    return result


def format_output_text(node_name: str, node_output: dict) -> str:
    output_key = NODE_OUTPUT_KEYS.get(node_name)
    if not output_key:
        return str(node_output)
    output_value = node_output.get(output_key, "")
    if isinstance(output_value, list):
        return "\n".join(str(item) for item in output_value)
    if isinstance(output_value, bool):
        return "Freigegeben" if output_value else "Überarbeitung angefordert"
    return str(output_value)


def get_full_state(config: dict, fallback: dict) -> dict:
    try:
        snapshot = graph.get_state(config)
        if snapshot and snapshot.values:
            return dict(snapshot.values)
    except Exception:
        pass
    return fallback


async def stream_graph_events(config: dict, input_value):
    current_state = {}
    started_nodes = set()

    async for stream_mode, chunk in graph.astream(
        input_value, config, stream_mode=["updates", "messages"]
    ):
        if stream_mode == "messages":
            msg_chunk, metadata = chunk
            node = metadata.get("langgraph_node", "")

            if node and node not in started_nodes:
                started_nodes.add(node)
                yield {
                    "event": "node_start",
                    "data": json.dumps({
                        "node": node,
                        "description": NODE_DESCRIPTIONS.get(node, ""),
                        "reads": NODE_READS.get(node, []),
                        "writes": NODE_WRITES.get(node, []),
                    }, ensure_ascii=False),
                }

            if (
                hasattr(msg_chunk, "content")
                and msg_chunk.content
                and getattr(msg_chunk, "type", "") in ("AIMessageChunk", "ai")
            ):
                yield {
                    "event": "token",
                    "data": json.dumps({
                        "node": node,
                        "content": msg_chunk.content,
                    }, ensure_ascii=False),
                }

        elif stream_mode == "updates":
            for node_name, node_output in chunk.items():
                if node_name == "__interrupt__":
                    continue

                if node_name not in started_nodes:
                    started_nodes.add(node_name)
                    yield {
                        "event": "node_start",
                        "data": json.dumps({
                            "node": node_name,
                            "description": NODE_DESCRIPTIONS.get(node_name, ""),
                            "reads": NODE_READS.get(node_name, []),
                            "writes": NODE_WRITES.get(node_name, []),
                        }, ensure_ascii=False),
                    }

                current_state.update(node_output)

                full_state = get_full_state(config, current_state)
                iteration = full_state.get("iteration", 0)
                output_text = format_output_text(node_name, node_output)

                yield {
                    "event": "node_update",
                    "data": json.dumps({
                        "node": node_name,
                        "status": "completed",
                        "iteration": iteration,
                        "output": output_text,
                        "state": serialize_state(full_state),
                        "changed_keys": list(node_output.keys()),
                        "reads": NODE_READS.get(node_name, []),
                        "writes": NODE_WRITES.get(node_name, []),
                    }, ensure_ascii=False),
                }

    graph_state = graph.get_state(config)
    if graph_state.tasks:
        for task in graph_state.tasks:
            if task.interrupts:
                node_name = task.name
                if node_name not in started_nodes:
                    yield {
                        "event": "node_start",
                        "data": json.dumps({
                            "node": node_name,
                            "description": NODE_DESCRIPTIONS.get(node_name, ""),
                            "reads": NODE_READS.get(node_name, []),
                            "writes": NODE_WRITES.get(node_name, []),
                        }, ensure_ascii=False),
                    }

                full_state = get_full_state(config, current_state)
                interrupt_value = task.interrupts[0].value
                yield {
                    "event": "interrupt",
                    "data": json.dumps({
                        **interrupt_value,
                        "node": node_name,
                        "state": serialize_state(full_state),
                        "reads": NODE_READS.get(node_name, []),
                        "writes": NODE_WRITES.get(node_name, []),
                    }, ensure_ascii=False),
                }
                return

    yield {"event": "done", "data": json.dumps({"status": "finished"})}


@app.get("/blog")
async def blog(topic: str, audience: str = ""):
    session_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}

    initial_state: BlogState = {
        "topic": topic,
        "audience": audience,
        "outline": [],
        "sources": [],
        "draft": "",
        "revision_notes": "",
        "iteration": 0,
        "approved": False,
        "final_article": "",
    }

    async def event_stream():
        yield {
            "event": "session",
            "data": json.dumps({"session_id": session_id}),
        }
        yield {
            "event": "state_init",
            "data": json.dumps(serialize_state(initial_state), ensure_ascii=False),
        }

        async for event in stream_graph_events(config, initial_state):
            yield event

    return EventSourceResponse(event_stream())


@app.post("/blog/{session_id}/resume")
async def store_resume(session_id: str, body: ResumeRequest):
    resume_store[session_id] = body.value
    return {"ok": True}


@app.get("/blog/{session_id}/stream")
async def stream_resume(session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    value = resume_store.pop(session_id, None)

    if value is None:
        return {"error": "no resume value found"}

    async def event_stream():
        async for event in stream_graph_events(config, Command(resume=value)):
            yield event

    return EventSourceResponse(event_stream())


@app.get("/health")
async def health():
    return {"status": "ok"}
