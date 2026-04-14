import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Copy, Check, X, Maximize2 } from 'lucide-react'

const STATE_FIELD_META = {
  question: { label: 'question', type: 'string', desc: 'Eingabe des Nutzers' },
  sub_topics: { label: 'sub_topics', type: 'list[str]', desc: 'Teilaspekte aus understand_topic' },
  gathered_info: { label: 'gathered_info', type: 'str', desc: 'Recherche-Ergebnisse' },
  quality_sufficient: { label: 'quality_sufficient', type: 'bool', desc: 'Qualitätsbewertung' },
  iteration: { label: 'iteration', type: 'int', desc: 'Zyklus-Zähler (max 2)' },
  refinement_notes: { label: 'refinement_notes', type: 'str', desc: 'Verfeinerungshinweise' },
  summary: { label: 'summary', type: 'str', desc: 'Zusammenfassung' },
  report: { label: 'report', type: 'str', desc: 'Finaler Output' },
}

function formatPreviewValue(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.length === 0 ? '[]' : `[${value.length} items]`
  if (value === '' || value === null || value === undefined) return '""'
  if (typeof value === 'string' && value.length > 40) return `"${value.substring(0, 40)}..."`
  return `"${value}"`
}

function getPreviewColor(value) {
  if (typeof value === 'boolean') return value ? 'text-emerald-400' : 'text-red-400'
  if (typeof value === 'number') return 'text-amber-400'
  if (Array.isArray(value) && value.length > 0) return 'text-violet-400'
  const str = typeof value === 'string' ? value : ''
  if (str === '') return 'text-slate-600'
  return 'text-slate-400'
}

function hasContent(value) {
  if (typeof value === 'boolean' || typeof value === 'number') return true
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'string' && value.length > 0
}

/* ─── Modal ─── */
function FieldModal({ name, value, onClose }) {
  const meta = STATE_FIELD_META[name] || { label: name, type: 'unknown', desc: '' }
  const isArray = Array.isArray(value)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="p-1.5 bg-sky-500/10 rounded-lg">
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-sky-400">{meta.label}</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{meta.type}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {typeof value === 'boolean' && (
              <span className={`inline-block font-mono text-sm px-3 py-1.5 rounded-lg ${value ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                {value ? 'true' : 'false'}
              </span>
            )}

            {typeof value === 'number' && (
              <span className="inline-block font-mono text-2xl text-amber-400 font-bold">
                {value}
              </span>
            )}

            {isArray && (
              <div className="space-y-1.5">
                {value.length === 0 ? (
                  <p className="text-sm text-slate-600 italic">Leeres Array</p>
                ) : (
                  value.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50"
                    >
                      <span className="font-mono text-xs text-slate-600 shrink-0 mt-0.5 w-6 text-right">{i}</span>
                      <p className="text-sm text-slate-300 break-all leading-relaxed">{item}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {typeof value === 'string' && (
              value === '' ? (
                <p className="text-sm text-slate-600 italic">Leerer String</p>
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap break-all leading-relaxed font-[system-ui]">
                  {value}
                </p>
              )
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-slate-600 font-mono">
              {typeof value === 'string' && `${value.length} chars`}
              {isArray && `${value.length} items`}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
            >
              Schliessen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Field Card (klickbar) ─── */
function StateField({ name, value, isChanged, onClick }) {
  const meta = STATE_FIELD_META[name] || { label: name, type: 'unknown', desc: '' }
  const clickable = hasContent(value)
  const preview = formatPreviewValue(value)
  const colorClass = getPreviewColor(value)

  return (
    <motion.button
      layout
      type="button"
      onClick={() => clickable && onClick(name)}
      disabled={!clickable}
      className={`
        w-full text-left rounded-lg border overflow-hidden transition-all duration-300 group
        ${isChanged
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-slate-800 bg-slate-900/50'
        }
        ${clickable
          ? 'cursor-pointer hover:border-sky-500/40 hover:bg-slate-800/60 hover:shadow-[0_0_12px_rgba(56,189,248,0.06)]'
          : 'cursor-default opacity-60'
        }
      `}
    >
      <div className="px-3 py-2.5 flex items-center gap-2">
        {/* Left: name + type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-semibold text-sky-400">{meta.label}</span>
            <span className="text-[10px] text-slate-600 font-mono">{meta.type}</span>
            {isChanged && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[9px] font-bold px-1.5 py-0 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
              >
                UPDATED
              </motion.span>
            )}
          </div>
          <span className={`font-mono text-xs ${colorClass} line-clamp-1`}>
            {preview}
          </span>
        </div>

        {/* Right: click hint */}
        {clickable && (
          <Maximize2 className="w-3.5 h-3.5 text-slate-700 group-hover:text-sky-400 transition-colors shrink-0" />
        )}
      </div>
    </motion.button>
  )
}

/* ─── Inspector ─── */
export default function StateInspector({ state, changedKeys }) {
  const [copied, setCopied] = useState(false)
  const [openField, setOpenField] = useState(null)

  const handleCopy = () => {
    if (!state) return
    navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden h-fit sticky top-20">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ResearchState
          </h2>
          <span className="text-[10px] font-mono text-slate-600 ml-1">TypedDict</span>
          {state && (
            <button onClick={handleCopy} className="ml-auto p-1 rounded hover:bg-slate-800 transition-colors" title="State kopieren">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          )}
        </div>

        <div className="p-3 space-y-1.5 max-h-[calc(100vh-160px)] overflow-y-auto">
          {!state ? (
            <div className="text-center py-8 text-slate-600">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">State wird nach Start angezeigt.</p>
              <pre className="mt-3 text-left text-[10px] font-mono text-slate-700 bg-slate-900 rounded-lg p-3 border border-slate-800">
{`class ResearchState(TypedDict):
    question: str
    sub_topics: list[str]
    gathered_info: str
    quality_sufficient: bool
    iteration: int
    refinement_notes: str
    summary: str
    report: str`}
              </pre>
            </div>
          ) : (
            Object.entries(state).map(([key, value]) => (
              <StateField
                key={key}
                name={key}
                value={value}
                isChanged={changedKeys.includes(key)}
                onClick={setOpenField}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {openField && state && (
        <FieldModal
          name={openField}
          value={state[openField]}
          onClose={() => setOpenField(null)}
        />
      )}
    </>
  )
}
