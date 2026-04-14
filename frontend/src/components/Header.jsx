import { Workflow } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Workflow className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            LangGraph Research Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Mehrstufiger AI-Workflow mit Zyklus-Logik
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            LangGraph + FastAPI + SSE
          </span>
        </div>
      </div>
    </header>
  )
}
