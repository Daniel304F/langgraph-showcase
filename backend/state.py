from typing import TypedDict


class BlogState(TypedDict):
    topic: str
    audience: str
    outline: list[str]
    sources: list[str]
    draft: str
    revision_notes: str
    iteration: int
    approved: bool
    final_article: str
