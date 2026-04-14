import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ChevronDown, ChevronUp } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const NODE_CODE = {
  understand_topic: {
    file: 'nodes.py',
    line: '11-33',
    code: `def understand_topic(state: ResearchState) -> dict:
    refinement = state.get("refinement_notes", "")
    context = ""
    if refinement:
        context = f"\\n\\nBisherige Erkenntnisse:\\n{refinement}"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. "
                   "Zerlege die Frage in 3-5 Teilaspekte..."),
        ("human", "Forschungsfrage: {question}{context}\\n\\n"
                  "Erstelle eine Liste von Teilaspekten...")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({
        "question": state["question"],
        "context": context
    })
    return {"sub_topics": [...]}`,
  },
  evaluate_sources: {
    file: 'nodes.py',
    line: '36-58',
    code: `def evaluate_sources(state: ResearchState) -> dict:
    sub_topics_text = "\\n".join(state.get("sub_topics", []))
    previous_info = state.get("gathered_info", "")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Du bist ein Forschungsassistent. "
                   "Analysiere die Teilaspekte..."),
        ("human", "Forschungsfrage: {question}\\n"
                  "Teilaspekte:\\n{sub_topics}\\n"
                  "Recherchiere zu jedem Teilaspekt...")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})

    combined = previous_info + "\\n" + result.content
    return {"gathered_info": combined.strip()}`,
  },
  check_quality: {
    file: 'nodes.py',
    line: '61-90',
    code: `def check_quality(state: ResearchState) -> dict:
    iteration = state.get("iteration", 0) + 1

    # Fallback: max 2 Iterationen
    if iteration >= 2:
        return {
            "quality_sufficient": True,
            "iteration": iteration,
        }

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bewerte ob die Informationen "
                   "ausreichend sind. Antworte NUR "
                   "mit 'JA' oder 'NEIN'..."),
        ("human", "Forschungsfrage: {question}\\n"
                  "Gesammelte Informationen:\\n{gathered_info}")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    is_sufficient = result.content.startswith("JA")
    return {
        "quality_sufficient": is_sufficient,
        "iteration": iteration,
    }`,
  },
  refine_topic: {
    file: 'nodes.py',
    line: '93-113',
    code: `def refine_topic(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identifiziere Lücken in der "
                   "bisherigen Recherche..."),
        ("human", "Forschungsfrage: {question}\\n"
                  "Bisherige Teilaspekte: ...\\n"
                  "Welche Aspekte fehlen noch?")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    return {"refinement_notes": result.content}`,
  },
  summarize: {
    file: 'nodes.py',
    line: '116-133',
    code: `def summarize(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Erstelle eine strukturierte "
                   "Zusammenfassung..."),
        ("human", "Forschungsfrage: {question}\\n"
                  "Alle Informationen:\\n{gathered_info}\\n"
                  "Erstelle eine Zusammenfassung...")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    return {"summary": result.content}`,
  },
  generate_report: {
    file: 'nodes.py',
    line: '136-157',
    code: `def generate_report(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Erstelle einen finalen "
                   "Forschungsbericht..."),
        ("human", "Forschungsfrage: {question}\\n"
                  "Zusammenfassung:\\n{summary}\\n"
                  "Erstelle Report mit Einleitung, "
                  "Haupterkenntnisse, Fazit.")
    ])

    chain = prompt | get_llm()
    result = chain.invoke({...})
    return {"report": result.content}`,
  },
}

const GRAPH_CODE = `# graph.py – LangGraph Workflow
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
graph.add_edge("generate_report", END)`

export default function CodeView({ activeNode, lastCompletedNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const nodeToShow = activeNode || lastCompletedNode

  const codeInfo = nodeToShow ? NODE_CODE[nodeToShow] : null

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
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
