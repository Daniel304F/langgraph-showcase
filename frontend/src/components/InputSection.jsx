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
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Forschungsfrage eingeben..."
          disabled={isRunning}
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50 text-sm"
        />
        <button
          type="submit"
          disabled={isRunning || !question.trim()}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition-all text-sm"
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

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-slate-500 py-1">Beispiele:</span>
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleExample(q)}
            disabled={isRunning}
            className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
