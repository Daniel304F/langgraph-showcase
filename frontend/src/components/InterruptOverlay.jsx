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
} from 'lucide-react'

function TopicReview({ data, onResume }) {
  const [topics, setTopics] = useState(data.sub_topics || [])
  const [editIndex, setEditIndex] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newTopic, setNewTopic] = useState('')

  const handleEdit = (index) => {
    setEditIndex(index)
    setEditValue(topics[index])
  }

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      setTopics((prev) => prev.map((t, i) => (i === editIndex ? editValue.trim() : t)))
    }
    setEditIndex(null)
    setEditValue('')
  }

  const handleDelete = (index) => {
    setTopics((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    if (newTopic.trim()) {
      setTopics((prev) => [...prev, newTopic.trim()])
      setNewTopic('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {topics.map((topic, i) => (
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
                <span className="flex-1 text-sm text-slate-300">{topic}</span>
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

      {/* Add new topic */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neuen Teilaspekt hinzufügen..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleAdd}
          disabled={!newTopic.trim()}
          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => onResume(topics)}
        disabled={topics.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-40"
      >
        <Sparkles className="w-4 h-4" />
        Bestätigen & Recherche starten
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function QualityCheck({ data, onResume }) {
  return (
    <div className="space-y-4">
      {data.gathered_info_preview && (
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 max-h-48 overflow-y-auto">
          <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">
            Bisherige Recherche-Ergebnisse (Vorschau)
          </p>
          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
            {data.gathered_info_preview}
          </p>
        </div>
      )}

      <p className="text-sm text-slate-300 text-center">
        Iteration {data.iteration}/2 abgeschlossen.
        Reichen die Informationen für einen guten Report?
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onResume(false)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold transition-all"
        >
          <XCircle className="w-4 h-4" />
          Nein, weiter recherchieren
        </button>

        <button
          onClick={() => onResume(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          Ja, Report erstellen
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
      className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.1)]"
    >
      {/* Header */}
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

      {/* Body */}
      <div className="p-4">
        {data.type === 'review_topics' && (
          <TopicReview data={data} onResume={onResume} />
        )}
        {data.type === 'quality_check' && (
          <QualityCheck data={data} onResume={onResume} />
        )}
      </div>
    </motion.div>
  )
}
