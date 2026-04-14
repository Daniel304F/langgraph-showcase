from langgraph.graph import StateGraph, END
from state import ResearchState
from nodes import (
    understand_topic,
    evaluate_sources,
    check_quality,
    refine_topic,
    summarize,
    generate_report,
)


def quality_router(state: ResearchState) -> str:
    if state.get("quality_sufficient", False):
        return "summarize"
    return "refine_topic"


def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("understand_topic", understand_topic)
    graph.add_node("evaluate_sources", evaluate_sources)
    graph.add_node("check_quality", check_quality)
    graph.add_node("refine_topic", refine_topic)
    graph.add_node("summarize", summarize)
    graph.add_node("generate_report", generate_report)

    graph.set_entry_point("understand_topic")
    graph.add_edge("understand_topic", "evaluate_sources")
    graph.add_edge("evaluate_sources", "check_quality")
    graph.add_conditional_edges("check_quality", quality_router, {
        "summarize": "summarize",
        "refine_topic": "refine_topic",
    })
    graph.add_edge("refine_topic", "understand_topic")
    graph.add_edge("summarize", "generate_report")
    graph.add_edge("generate_report", END)

    return graph.compile()
