from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from state import BlogState
from nodes import (
    plan_outline,
    collect_sources,
    draft_article,
    review_draft,
    revise_article,
    finalize,
)


def review_router(state: BlogState) -> str:
    if state.get("approved", False):
        return "finalize"
    if state.get("iteration", 0) >= 2:
        return "finalize"
    return "revise_article"


def build_graph():
    graph = StateGraph(BlogState)

    graph.add_node("plan_outline", plan_outline)
    graph.add_node("collect_sources", collect_sources)
    graph.add_node("draft_article", draft_article)
    graph.add_node("review_draft", review_draft)
    graph.add_node("revise_article", revise_article)
    graph.add_node("finalize", finalize)

    graph.set_entry_point("plan_outline")
    graph.add_edge("plan_outline", "collect_sources")
    graph.add_edge("collect_sources", "draft_article")
    graph.add_edge("draft_article", "review_draft")
    graph.add_conditional_edges("review_draft", review_router, {
        "finalize": "finalize",
        "revise_article": "revise_article",
    })
    graph.add_edge("revise_article", "draft_article")
    graph.add_edge("finalize", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)
