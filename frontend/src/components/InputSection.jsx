import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

const EXAMPLES = [
  { topic: 'Wie verändert KI den Journalismus?', audience: 'Medieninteressierte Leser' },
  { topic: 'Warum sollten Unternehmen auf Open Source setzen?', audience: 'CTOs und Tech-Leads' },
  { topic: 'Praktische Einstiegstipps für selbstgehosteten Hugo-Blog', audience: 'Entwickler mit Grundkenntnissen' },
]

export default function InputSection({ onSubmit, isRunning }) {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!topic.trim() || isRunning) return
    onSubmit({ topic: topic.trim(), audience: audience.trim() })
  }

  const handleExample = (ex) => {
    setTopic(ex.topic)
    setAudience(ex.audience)
    if (!isRunning) onSubmit(ex)
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Thema oder Fragestellung für deinen Blogartikel..."
          disabled={isRunning}
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 focus:bg-slate-900 transition-all disabled:opacity-50 text-sm backdrop-blur-sm"
        />
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Zielgruppe (optional)"
          disabled={isRunning}
          className="sm:w-64 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 focus:bg-slate-900 transition-all disabled:opacity-50 text-sm backdrop-blur-sm"
        />
        <button
          type="submit"
          disabled={isRunning || !topic.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:shadow-none"
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
        {EXAMPLES.map((ex) => (
          <button
            key={ex.topic}
            onClick={() => handleExample(ex)}
            disabled={isRunning}
            className="text-[11px] px-3 py-1 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ex.topic}
          </button>
        ))}
      </div>
    </div>
  )
}
