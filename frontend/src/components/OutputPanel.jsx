import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, MessageSquare } from 'lucide-react'

const NODE_LABELS = {
  understand_topic: 'Thema verstehen',
  evaluate_sources: 'Quellen bewerten',
  check_quality: 'Qualität prüfen',
  refine_topic: 'Thema verfeinern',
  summarize: 'Zusammenfassen',
  generate_report: 'Report erstellen',
}

const NODE_COLORS = {
  understand_topic: 'blue',
  evaluate_sources: 'indigo',
  check_quality: 'amber',
  refine_topic: 'orange',
  summarize: 'purple',
  generate_report: 'emerald',
}

function getColorClasses(color) {
  const map = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-500' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  }
  return map[color] || map.blue
}

export default function OutputPanel({ blocks, isRunning, activeNode, streamingText, streamingNode }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [blocks, activeNode, streamingText])

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-500" />
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Live Output
        </h2>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span className="text-[10px] text-blue-400/80 font-mono">aktiv</span>
          </span>
        )}
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto space-y-3 scrollbar-thin">
        {blocks.length === 0 && !isRunning && !streamingNode && (
          <div className="text-center py-12 text-slate-600">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Starte eine Recherche, um den Workflow zu sehen.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {blocks.map((block, i) => {
            const color = NODE_COLORS[block.node] || 'blue'
            const classes = getColorClasses(color)

            return (
              <motion.div
                key={`${block.node}-${block.iteration}-${i}`}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`rounded-xl border ${classes.border} overflow-hidden`}
              >
                <div className={`px-3 py-2 ${classes.bg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${classes.dot}`} />
                    <span className={`text-xs font-semibold ${classes.text}`}>
                      {NODE_LABELS[block.node] || block.node}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    {block.iteration > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Iter. {block.iteration}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600 font-mono">{block.timestamp}</span>
                  </div>
                </div>
                <div className="px-3 py-2.5 text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto font-[system-ui]">
                  {block.output}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Live token streaming block */}
        <AnimatePresence>
          {streamingNode && streamingText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-blue-500/20 overflow-hidden"
            >
              <div className="px-3 py-2 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-semibold text-blue-400">
                    {NODE_LABELS[streamingNode] || streamingNode}
                  </span>
                  <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                  STREAMING
                </span>
              </div>
              <div className="px-3 py-2.5 text-[13px] leading-relaxed text-slate-400 whitespace-pre-wrap max-h-60 overflow-y-auto font-[system-ui]">
                {streamingText}
                <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-text-bottom" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active node indicator (no tokens yet) */}
        <AnimatePresence>
          {activeNode && !streamingText && isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
            >
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-300">
                  {NODE_LABELS[activeNode] || activeNode}
                </p>
                <p className="text-xs text-slate-500">LLM verarbeitet...</p>
              </div>
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
