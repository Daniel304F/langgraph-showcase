import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Hand,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Link2,
  Lightbulb,
  MessageSquareText,
} from 'lucide-react'

/* ─── 1. Outline Review ─── */
function OutlineReview({ data, onResume }) {
  const [items, setItems] = useState(data.outline || [])
  const [editIndex, setEditIndex] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newItem, setNewItem] = useState('')

  const handleEdit = (i) => {
    setEditIndex(i)
    setEditValue(items[i])
  }

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      setItems((prev) => prev.map((t, i) => (i === editIndex ? editValue.trim() : t)))
    }
    setEditIndex(null)
    setEditValue('')
  }

  const handleDelete = (i) => {
    setItems((prev) => prev.filter((_, j) => j !== i))
  }

  const handleAdd = () => {
    if (newItem.trim()) {
      setItems((prev) => [...prev, newItem.trim()])
      setNewItem('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-start gap-2 bg-slate-800/80 rounded-lg p-2.5 border border-slate-700"
          >
            <span className="text-xs font-mono text-slate-500 mt-1 shrink-0 w-5">
              {i + 1}.
            </span>

            {editIndex === i ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                  className="flex-1 bg-slate-900 border border-blue-500/50 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none"
                />
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-500"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-300">{item}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(i)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neuen Abschnitt hinzufügen..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => onResume(items)}
        disabled={items.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold transition-all disabled:opacity-40 shadow-lg shadow-blue-500/10"
      >
        <Sparkles className="w-4 h-4" />
        Outline bestätigen
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ─── 2. Add Sources ─── */
function AddSources({ data, onResume }) {
  const [sources, setSources] = useState(data.existing_sources || [])
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const handleAdd = () => {
    const trimmedUrl = url.trim()
    const trimmedLabel = label.trim()
    if (!trimmedUrl && !trimmedLabel) return
    const entry = trimmedLabel && trimmedUrl
      ? `${trimmedLabel} :: ${trimmedUrl}`
      : trimmedUrl || trimmedLabel
    setSources((prev) => [...prev, entry])
    setLabel('')
    setUrl('')
  }

  const handleDelete = (i) => {
    setSources((prev) => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-4">
      {data.suggestions && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] uppercase text-amber-400 font-semibold">
              Vorschläge des Assistenten
            </p>
          </div>
          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
            {data.suggestions}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sources.length === 0 && (
          <p className="text-xs text-slate-600 italic text-center py-2">
            Noch keine Quellen hinterlegt. Du kannst auch ohne Quellen weiter.
          </p>
        )}
        {sources.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-start gap-2 bg-slate-800/80 rounded-lg p-2.5 border border-slate-700"
          >
            <Link2 className="w-3.5 h-3.5 text-sky-400 mt-1 shrink-0" />
            <span className="flex-1 text-xs text-slate-300 break-all leading-relaxed">{s}</span>
            <button
              onClick={() => handleDelete(i)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label / Titel"
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="https://... oder eigene Notiz"
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleAdd}
          disabled={!url.trim() && !label.trim()}
          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => onResume(sources)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/10"
      >
        <Sparkles className="w-4 h-4" />
        {sources.length > 0 ? `${sources.length} Quelle${sources.length === 1 ? '' : 'n'} übernehmen` : 'Ohne Quellen fortfahren'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ─── 3. Draft Review ─── */
function DraftReview({ data, onResume }) {
  const [feedback, setFeedback] = useState('')

  return (
    <div className="space-y-4">
      {data.draft_preview && (
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 max-h-64 overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquareText className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-[10px] uppercase text-purple-400 font-semibold">
              Aktueller Entwurf
            </p>
          </div>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-[system-ui]">
            {data.draft_preview}
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        Review {data.iteration}/2 — Entwurf freigeben oder Überarbeitung anfordern.
      </p>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Optional: Was soll in der Überarbeitung besser werden? (z. B. 'Einleitung kürzen, mehr Beispiele im Abschnitt 2')"
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onResume({ approved: false, revision_notes: feedback.trim() })}
          disabled={!feedback.trim()}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title={!feedback.trim() ? 'Bitte Feedback formulieren' : ''}
        >
          <XCircle className="w-4 h-4" />
          Überarbeiten
        </button>

        <button
          onClick={() => onResume({ approved: true, revision_notes: '' })}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          Freigeben & finalisieren
        </button>
      </div>
    </div>
  )
}

export default function InterruptOverlay({ data, onResume }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.1)] backdrop-blur-sm"
    >
      <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
        <div className="p-1.5 bg-amber-500/20 rounded-lg">
          <Hand className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-300">
            Human-in-the-Loop
          </h3>
          <p className="text-xs text-slate-400">{data.message}</p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
          WARTET AUF INPUT
        </span>
      </div>

      <div className="p-4">
        {data.type === 'review_outline' && <OutlineReview data={data} onResume={onResume} />}
        {data.type === 'add_sources' && <AddSources data={data} onResume={onResume} />}
        {data.type === 'review_draft' && <DraftReview data={data} onResume={onResume} />}
      </div>
    </motion.div>
  )
}
