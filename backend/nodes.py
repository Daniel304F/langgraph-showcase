import os

from langgraph.types import interrupt
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from state import BlogState


def get_llm():
    return ChatOpenAI(
        model="gwdg/llama-3.3-70b-instruct",
        temperature=0.4,
        base_url=os.environ.get("OPENAI_API_BASE"),
    )


def plan_outline(state: BlogState) -> dict:
    revision = state.get("revision_notes", "")
    context = f"\n\nFrühere Hinweise:\n{revision}" if revision else ""
    audience = state.get("audience", "") or "allgemeines interessiertes Publikum"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein erfahrener Blog-Redakteur. Erstelle eine klare "
                   "Outline für einen Blogartikel. Nutze 4-6 Abschnitte mit "
                   "prägnanten Überschriften."),
        ("human", "Thema / Fragestellung: {topic}\n"
                  "Zielgruppe: {audience}{context}\n\n"
                  "Erstelle eine strukturierte Outline. Gib NUR die Überschriften "
                  "als nummerierte Liste zurück, ohne weitere Erklärungen.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "topic": state["topic"],
        "audience": audience,
        "context": context,
    })

    lines = [line.strip() for line in result.content.strip().split("\n") if line.strip()]

    approved_outline = interrupt({
        "type": "review_outline",
        "outline": lines,
        "message": "Prüfe die Outline deines Blogartikels. Du kannst Abschnitte "
                   "umschreiben, entfernen oder neue hinzufügen.",
    })

    return {
        "outline": approved_outline,
    }


def collect_sources(state: BlogState) -> dict:
    outline_text = "\n".join(state.get("outline", []))

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Recherche-Assistent. Schlage dem Autor 3-4 "
                   "Arten von Quellen vor, die für den Artikel hilfreich wären "
                   "(z. B. Studien, offizielle Dokumentation, Experteninterviews). "
                   "Sei konkret, aber erfinde keine echten URLs."),
        ("human", "Thema: {topic}\n\nOutline:\n{outline}\n\n"
                  "Welche Arten von Quellen wären besonders wertvoll? "
                  "Formatiere als kurze nummerierte Liste mit je einem Satz.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "topic": state["topic"],
        "outline": outline_text,
    })

    suggestions = result.content.strip()
    existing_sources = state.get("sources", [])

    user_sources = interrupt({
        "type": "add_sources",
        "suggestions": suggestions,
        "existing_sources": existing_sources,
        "message": "Füge deine eigenen Quellen hinzu. Verlinke Artikel, Studien, "
                   "interne Dokumente oder persönliche Notizen. Diese fließen "
                   "direkt in den Artikel ein.",
    })

    return {
        "sources": user_sources or [],
    }


def draft_article(state: BlogState) -> dict:
    outline_text = "\n".join(state.get("outline", []))
    sources_text = "\n".join(state.get("sources", [])) or "Keine Quellen angegeben."
    revision = state.get("revision_notes", "")
    previous_draft = state.get("draft", "")

    revision_block = ""
    if revision and previous_draft:
        revision_block = (
            f"\n\nBisheriger Entwurf:\n{previous_draft}\n\n"
            f"Überarbeitungshinweise vom Autor:\n{revision}\n\n"
            "Überarbeite den Entwurf entsprechend."
        )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein professioneller Blogautor. Schreibe einen gut "
                   "lesbaren Blogartikel in klarem Deutsch. Nutze die Outline "
                   "als Struktur. Erwähne die angegebenen Quellen im Text und "
                   "verweise am Ende im Abschnitt 'Quellen' auf sie."),
        ("human", "Thema: {topic}\n"
                  "Zielgruppe: {audience}\n\n"
                  "Outline:\n{outline}\n\n"
                  "Verfügbare Quellen:\n{sources}{revision_block}\n\n"
                  "Schreibe den Blogartikel als Markdown.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "topic": state["topic"],
        "audience": state.get("audience", "") or "allgemeines interessiertes Publikum",
        "outline": outline_text,
        "sources": sources_text,
        "revision_block": revision_block,
    })

    return {
        "draft": result.content.strip(),
    }


def review_draft(state: BlogState) -> dict:
    iteration = state.get("iteration", 0) + 1

    if iteration > 2:
        return {
            "approved": True,
            "iteration": iteration,
            "revision_notes": "",
        }

    decision = interrupt({
        "type": "review_draft",
        "iteration": iteration,
        "draft_preview": state.get("draft", ""),
        "message": "Prüfe den Entwurf. Gib ihn frei oder formuliere "
                   "Überarbeitungshinweise für die nächste Version.",
    })

    if isinstance(decision, dict):
        return {
            "approved": bool(decision.get("approved", False)),
            "revision_notes": decision.get("revision_notes", "") or "",
            "iteration": iteration,
        }

    return {
        "approved": bool(decision),
        "iteration": iteration,
        "revision_notes": "",
    }


def revise_article(state: BlogState) -> dict:
    # Dieser Node existiert, um die Zyklus-Semantik im Graph sichtbar zu machen.
    # Die eigentliche Überarbeitung passiert in draft_article, sobald
    # revision_notes gesetzt sind – so bleibt der Prompt-Code an einer Stelle.
    return {}


def finalize(state: BlogState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Blog-Editor. Erstelle die finale, "
                   "veröffentlichungsreife Fassung des Artikels. Ergänze "
                   "einen Titel, eine kurze Meta-Description (max. 160 Zeichen) "
                   "und drei passende Tags. Formatiere als Markdown."),
        ("human", "Thema: {topic}\n\n"
                  "Freigegebener Entwurf:\n{draft}\n\n"
                  "Liefere das finale Ergebnis in folgendem Format:\n\n"
                  "# <Titel>\n\n"
                  "**Meta-Description:** <text>\n\n"
                  "**Tags:** tag1, tag2, tag3\n\n"
                  "---\n\n<Artikel als Markdown>")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "topic": state["topic"],
        "draft": state.get("draft", ""),
    })

    return {
        "final_article": result.content.strip(),
    }
