import { PenLine, Zap, Info } from 'lucide-react'

export default function Header({ onInfoClick }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 py-3.5 flex items-center gap-3">
        <div className="relative p-2 bg-gradient-to-br from-blue-500/20 to-sky-500/10 rounded-xl border border-blue-500/20">
          <PenLine className="w-5 h-5 text-blue-400" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight">
            LangGraph Blog Writer
          </h1>
          <p className="text-[11px] text-slate-500 leading-tight">
            Kollaborativer Blog-Workflow mit eigenen Quellen & Human-in-the-Loop
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onInfoClick}
            className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            Info
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <Zap className="w-3 h-3 text-amber-400" />
            LangGraph + FastAPI + SSE
          </span>
        </div>
      </div>
    </header>
  )
}
