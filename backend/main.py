import json
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from graph import build_graph
from state import ResearchState

load_dotenv()

app = FastAPI(title="LangGraph Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()

NODE_OUTPUT_KEYS = {
    "understand_topic": "sub_topics",
    "evaluate_sources": "gathered_info",
    "check_quality": "quality_sufficient",
    "refine_topic": "refinement_notes",
    "summarize": "summary",
    "generate_report": "report",
}

NODE_DESCRIPTIONS = {
    "understand_topic": "Zerlegt die Forschungsfrage in Teilaspekte und Suchbegriffe",
    "evaluate_sources": "Recherchiert und sammelt Informationen zu jedem Teilaspekt",
    "check_quality": "Bewertet ob die gesammelten Infos ausreichend sind",
    "refine_topic": "Verfeinert die Suchstrategie basierend auf Lücken",
    "summarize": "Verdichtet alle Informationen zu einem Überblick",
    "generate_report": "Erstellt den finalen, lesbaren Report",
}


def serialize_state(state: dict) -> dict:
    """Serialize state for JSON, converting non-serializable types."""
    result = {}
    for key, value in state.items():
        if isinstance(value, (str, int, float, bool)):
            result[key] = value
        elif isinstance(value, list):
            result[key] = [str(item) for item in value]
        else:
            result[key] = str(value)
    return result


@app.get("/research")
async def research(question: str):
    async def event_stream():
        initial_state: ResearchState = {
            "question": question,
            "sub_topics": [],
            "gathered_info": "",
            "quality_sufficient": False,
            "iteration": 0,
            "refinement_notes": "",
            "summary": "",
            "report": "",
        }

        current_state = dict(initial_state)

        # Send initial state
        yield {
            "event": "state_init",
            "data": json.dumps(serialize_state(current_state), ensure_ascii=False),
        }
        await asyncio.sleep(0.05)

        for event in graph.stream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                # Send "running" event before processing
                yield {
                    "event": "node_start",
                    "data": json.dumps({
                        "node": node_name,
                        "description": NODE_DESCRIPTIONS.get(node_name, ""),
                        "output_key": NODE_OUTPUT_KEYS.get(node_name, ""),
                    }, ensure_ascii=False),
                }
                await asyncio.sleep(0.05)

                current_state.update(node_output)
                iteration = current_state.get("iteration", 0)

                output_key = NODE_OUTPUT_KEYS.get(node_name)
                if output_key:
                    output_value = node_output.get(output_key, "")
                    if isinstance(output_value, list):
                        output_text = "\n".join(str(item) for item in output_value)
                    elif isinstance(output_value, bool):
                        output_text = "Ja" if output_value else "Nein"
                    else:
                        output_text = str(output_value)
                else:
                    output_text = str(node_output)

                data = json.dumps({
                    "node": node_name,
                    "status": "completed",
                    "iteration": iteration,
                    "output": output_text,
                    "state": serialize_state(current_state),
                    "changed_keys": list(node_output.keys()),
                }, ensure_ascii=False)

                yield {"event": "node_update", "data": data}
                await asyncio.sleep(0.05)

        yield {"event": "done", "data": json.dumps({"status": "finished"})}

    return EventSourceResponse(event_stream())


@app.get("/health")
async def health():
    return {"status": "ok"}
