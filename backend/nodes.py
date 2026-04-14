import os

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from state import ResearchState


def get_llm():
    return ChatOpenAI(
        model="gwdg/llama-3.3-70b-instruct",
        temperature=0.3,
        base_url=os.environ.get("OPENAI_API_BASE"),
    )


def understand_topic(state: ResearchState) -> dict:
    refinement = state.get("refinement_notes", "")
    context = ""
    if refinement:
        context = f"\n\nBisherige Erkenntnisse und Verfeinerungen:\n{refinement}"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. Zerlege die gegebene Forschungsfrage "
                   "in 3-5 konkrete Teilaspekte und definiere passende Suchbegriffe."),
        ("human", "Forschungsfrage: {question}{context}\n\n"
                  "Erstelle eine Liste von Teilaspekten mit jeweils passenden Suchbegriffen. "
                  "Formatiere als nummerierte Liste.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({"question": state["question"], "context": context})

    lines = [line.strip() for line in result.content.strip().split("\n") if line.strip()]

    return {
        "sub_topics": lines,
    }


def evaluate_sources(state: ResearchState) -> dict:
    sub_topics_text = "\n".join(state.get("sub_topics", []))
    previous_info = state.get("gathered_info", "")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. Analysiere die Teilaspekte und "
                   "sammle strukturierte Informationen zu jedem Punkt."),
        ("human", "Forschungsfrage: {question}\n\n"
                  "Teilaspekte:\n{sub_topics}\n\n"
                  "Bereits gesammelte Informationen:\n{previous_info}\n\n"
                  "Recherchiere zu jedem Teilaspekt und fasse die wichtigsten Erkenntnisse zusammen.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "sub_topics": sub_topics_text,
        "previous_info": previous_info or "Noch keine.",
    })

    combined = previous_info + "\n\n" + result.content if previous_info else result.content

    return {
        "gathered_info": combined.strip(),
    }


def check_quality(state: ResearchState) -> dict:
    iteration = state.get("iteration", 0) + 1

    if iteration >= 2:
        return {
            "quality_sufficient": True,
            "iteration": iteration,
        }

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein kritischer Reviewer. Bewerte ob die gesammelten Informationen "
                   "die Forschungsfrage ausreichend abdecken. Antworte NUR mit 'JA' oder 'NEIN' "
                   "gefolgt von einer kurzen Begründung."),
        ("human", "Forschungsfrage: {question}\n\n"
                  "Gesammelte Informationen:\n{gathered_info}\n\n"
                  "Sind die Informationen ausreichend um einen umfassenden Bericht zu erstellen?")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "gathered_info": state.get("gathered_info", ""),
    })

    is_sufficient = result.content.strip().upper().startswith("JA")

    return {
        "quality_sufficient": is_sufficient,
        "iteration": iteration,
    }


def refine_topic(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. Identifiziere Lücken in der bisherigen "
                   "Recherche und schlage eine verfeinerte Suchstrategie vor."),
        ("human", "Forschungsfrage: {question}\n\n"
                  "Bisherige Teilaspekte:\n{sub_topics}\n\n"
                  "Gesammelte Informationen:\n{gathered_info}\n\n"
                  "Welche Aspekte fehlen noch? Welche Suchbegriffe sollten ergänzt werden? "
                  "Erstelle eine verfeinerte Strategie.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "sub_topics": "\n".join(state.get("sub_topics", [])),
        "gathered_info": state.get("gathered_info", ""),
    })

    return {
        "refinement_notes": result.content.strip(),
    }


def summarize(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. Erstelle eine strukturierte Zusammenfassung "
                   "aller gesammelten Informationen."),
        ("human", "Forschungsfrage: {question}\n\n"
                  "Alle gesammelten Informationen:\n{gathered_info}\n\n"
                  "Erstelle eine klar strukturierte Zusammenfassung mit den wichtigsten Erkenntnissen.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "gathered_info": state.get("gathered_info", ""),
    })

    return {
        "summary": result.content.strip(),
    }


def generate_report(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein professioneller Report-Autor. Erstelle einen gut lesbaren, "
                   "finalen Forschungsbericht basierend auf der Zusammenfassung."),
        ("human", "Forschungsfrage: {question}\n\n"
                  "Zusammenfassung:\n{summary}\n\n"
                  "Erstelle einen finalen Report mit:\n"
                  "- Einleitung\n"
                  "- Haupterkenntnisse (strukturiert nach Themen)\n"
                  "- Fazit\n\n"
                  "Der Report soll informativ und gut lesbar sein.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "summary": state.get("summary", ""),
    })

    return {
        "report": result.content.strip(),
    }
