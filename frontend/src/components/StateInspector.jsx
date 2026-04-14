import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

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

function StateField({ name, value, isChanged }) {
  const [expanded, setExpanded] = useState(false)
  const meta = STATE_FIELD_META[name] || { label: name, type: 'unknown', desc: '' }

  const isEmpty = value === '' || value === null || value === undefined ||
    (Array.isArray(value) && value.length === 0)
  const isLong = typeof value === 'string' && value.length > 80
  const isArray = Array.isArray(value)

  const displayValue = () => {
    if (typeof value === 'boolean') {
      return (
        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {value ? 'true' : 'false'}
        </span>
      )
    }
    if (typeof value === 'number') {
      return <span className="font-mono text-xs text-amber-400">{value}</span>
    }
    if (isArray) {
      if (isEmpty) return <span className="font-mono text-xs text-slate-600">[]</span>
      return (
        <span className="font-mono text-xs text-slate-400">
          [{value.length} items]
        </span>
      )
    }
    if (isEmpty) {
      return <span className="font-mono text-xs text-slate-600">&quot;&quot;</span>
    }
    if (isLong && !expanded) {
      return (
        <span className="font-mono text-xs text-slate-400 line-clamp-1">
          &quot;{value.substring(0, 60)}...&quot;
        </span>
      )
    }
    return (
      <span className="font-mono text-xs text-slate-300 break-all">
        &quot;{value}&quot;
      </span>
    )
  }

  const canExpand = (isLong || isArray) && !isEmpty

  return (
    <motion.div
      layout
      className={`
        rounded-lg border overflow-hidden transition-colors duration-500
        ${isChanged
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-slate-800 bg-slate-900/50'
        }
      `}
    >
      <button
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`w-full px-3 py-2 flex items-start gap-2 text-left ${canExpand ? 'cursor-pointer hover:bg-slate-800/50' : 'cursor-default'}`}
      >
        {canExpand ? (
          expanded ? <ChevronDown className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
        ) : (
          <div className="w-3 shrink-0" />
        )}

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
          <p className="text-[10px] text-slate-600 mb-1">{meta.desc}</p>
          {displayValue()}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800"
          >
            <div className="px-3 py-2 max-h-48 overflow-y-auto">
              {isArray ? (
                <div className="space-y-1">
                  {value.map((item, i) => (
                    <div key={i} className="font-mono text-xs text-slate-400 flex gap-2">
                      <span className="text-slate-600 shrink-0">[{i}]</span>
                      <span className="break-all">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">{value}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function StateInspector({ state, changedKeys }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!state) return
    navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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

      <div className="p-3 space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto">
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
            />
          ))
        )}
      </div>
    </div>
  )
}
