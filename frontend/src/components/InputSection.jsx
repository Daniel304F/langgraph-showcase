import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  'Wie beeinflusst Quantencomputing die Kryptografie?',
  'Welche Auswirkungen hat KI auf den Arbeitsmarkt?',
  'Was sind die neuesten Entwicklungen bei erneuerbaren Energien?',
]

export default function InputSection({ onSubmit, isRunning }) {
  const [question, setQuestion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim() || isRunning) return
    onSubmit(question.trim())
  }

  const handleExample = (q) => {
    setQuestion(q)
    if (!isRunning) onSubmit(q)
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Forschungsfrage eingeben..."
            disabled={isRunning}
            className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 focus:bg-slate-900 transition-all disabled:opacity-50 text-sm backdrop-blur-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isRunning || !question.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition-all text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:shadow-none"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Läuft...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Starten
            </>
          )}
        </button>
      </form>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-slate-500 py-1">Beispiele:</span>
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleExample(q)}
            disabled={isRunning}
            className="text-[11px] px-3 py-1 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
