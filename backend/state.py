from typing import TypedDict


class ResearchState(TypedDict):
    question: str
    sub_topics: list[str]
    gathered_info: str
    quality_sufficient: bool
    iteration: int
    refinement_notes: str
    summary: str
    report: str
