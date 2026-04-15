import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ChevronDown, ChevronUp } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const NODE_CODE = {
  plan_outline: {
    file: 'nodes.py',
    line: '18-45',
    code: `def plan_outline(state: BlogState) -> dict:
    revision = state.get("revision_notes", "")
    context = f"\\n\\nFrühere Hinweise:\\n{revision}" if revision else ""
    audience = state.get("audience", "") or "allgemeines Publikum"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein erfahrener Blog-Redakteur. "
                   "Erstelle eine Outline mit 4-6 Abschnitten."),
        ("human", "Thema: {topic}\\nZielgruppe: {audience}{context}")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    lines = [l.strip() for l in result.content.split("\\n") if l.strip()]

    # >>> Human-in-the-Loop <<<
    # Nutzer bearbeitet die Outline direkt im UI
    approved_outline = interrupt({
        "type": "review_outline",
        "outline": lines,
        "message": "Prüfe die Outline deines Blogartikels.",
    })

    return {"outline": approved_outline}`,
  },
  collect_sources: {
    file: 'nodes.py',
    line: '48-82',
    code: `def collect_sources(state: BlogState) -> dict:
    outline_text = "\\n".join(state.get("outline", []))

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Schlage 3-4 Arten von Quellen vor, die für "
                   "den Artikel wertvoll wären. Keine fiktiven URLs."),
        ("human", "Thema: {topic}\\nOutline:\\n{outline}")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    suggestions = result.content.strip()

    # >>> Human-in-the-Loop <<<
    # Nutzer hinterlegt eigene URLs, Studien, Notizen
    user_sources = interrupt({
        "type": "add_sources",
        "suggestions": suggestions,
        "existing_sources": state.get("sources", []),
        "message": "Füge deine eigenen Quellen hinzu.",
    })

    return {"sources": user_sources or []}`,
  },
  draft_article: {
    file: 'nodes.py',
    line: '85-125',
    code: `def draft_article(state: BlogState) -> dict:
    outline_text = "\\n".join(state.get("outline", []))
    sources_text = "\\n".join(state.get("sources", []))
    revision = state.get("revision_notes", "")
    previous_draft = state.get("draft", "")

    # Beim zweiten Durchlauf fließen Feedback + alter
    # Entwurf in den Prompt ein.
    revision_block = ""
    if revision and previous_draft:
        revision_block = (
            f"\\nBisheriger Entwurf:\\n{previous_draft}\\n"
            f"Überarbeitungshinweise:\\n{revision}"
        )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein professioneller Blogautor. "
                   "Schreibe einen Markdown-Artikel und "
                   "referenziere die Quellen."),
        ("human", "Thema: {topic}\\nOutline:\\n{outline}\\n"
                  "Quellen:\\n{sources}{revision_block}")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    return {"draft": result.content.strip()}`,
  },
  review_draft: {
    file: 'nodes.py',
    line: '128-158',
    code: `def review_draft(state: BlogState) -> dict:
    iteration = state.get("iteration", 0) + 1

    # Fallback: nach 2 Runden automatisch freigeben
    if iteration > 2:
        return {"approved": True, "iteration": iteration,
                "revision_notes": ""}

    # >>> Human-in-the-Loop <<<
    # Nutzer sieht den Entwurf und entscheidet
    decision = interrupt({
        "type": "review_draft",
        "iteration": iteration,
        "draft_preview": state.get("draft", ""),
        "message": "Freigeben oder Feedback geben?",
    })

    return {
        "approved": bool(decision.get("approved", False)),
        "revision_notes": decision.get("revision_notes", ""),
        "iteration": iteration,
    }`,
  },
  revise_article: {
    file: 'nodes.py',
    line: '161-165',
    code: `def revise_article(state: BlogState) -> dict:
    # Pass-through Node: macht den Zyklus im Graph
    # sichtbar. Die Überarbeitungslogik selbst steckt
    # in draft_article (liest revision_notes).
    return {}`,
  },
  finalize: {
    file: 'nodes.py',
    line: '168-192',
    code: `def finalize(state: BlogState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Blog-Editor. Erstelle die "
                   "finale Fassung mit Titel, Meta-Description "
                   "und Tags."),
        ("human", "Thema: {topic}\\n\\n"
                  "Freigegebener Entwurf:\\n{draft}\\n\\n"
                  "Liefere als Markdown:\\n"
                  "# <Titel>\\n"
                  "**Meta-Description:** ...\\n"
                  "**Tags:** t1, t2, t3\\n"
                  "---\\n<Artikel>")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    return {"final_article": result.content.strip()}`,
  },
}

const GRAPH_CODE = `# graph.py – LangGraph Blog Writer
from langgraph.checkpoint.memory import MemorySaver

def review_router(state: BlogState) -> str:
    if state.get("approved", False):
        return "finalize"
    if state.get("iteration", 0) >= 2:
        return "finalize"
    return "revise_article"

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

# MemorySaver ermöglicht interrupt() & resume
compiled = graph.compile(checkpointer=MemorySaver())`

export default function CodeView({ activeNode, lastCompletedNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const nodeToShow = activeNode || lastCompletedNode

  const codeInfo = nodeToShow ? NODE_CODE[nodeToShow] : null

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-b border-slate-800 flex items-center gap-2 hover:bg-slate-800/30 transition-colors"
      >
        <Code2 className="w-4 h-4 text-slate-500" />
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Code-Ansicht
        </h2>
        {nodeToShow && codeInfo && (
          <span className="text-[10px] font-mono text-slate-600 ml-1">
            {codeInfo.file}:{codeInfo.line}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-500 ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-auto" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="max-h-[300px] overflow-y-auto">
              {codeInfo ? (
                <div>
                  <div className="px-3 py-1.5 bg-slate-800/50 flex items-center gap-2 border-b border-slate-800">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {codeInfo.file} — {nodeToShow}()
                    </span>
                    {activeNode && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </div>
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '12px',
                      background: 'transparent',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                    showLineNumbers
                    wrapLines
                  >
                    {codeInfo.code}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-1.5 bg-slate-800/50 flex items-center gap-2 border-b border-slate-800">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">graph.py</span>
                  </div>
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '12px',
                      background: 'transparent',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                    showLineNumbers
                  >
                    {GRAPH_CODE}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
