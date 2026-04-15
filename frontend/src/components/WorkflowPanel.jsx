import { motion, AnimatePresence } from 'framer-motion'
import {
  ListChecks, Link2, PenLine, Eye, RefreshCw, Sparkles,
  ArrowDown, RotateCcw, ChevronRight, Hand, CheckCircle2,
} from 'lucide-react'

const ICON_MAP = {
  list: ListChecks,
  link: Link2,
  pen: PenLine,
  eye: Eye,
  refresh: RefreshCw,
  sparkles: Sparkles,
}

export default function WorkflowPanel({ nodes, activeNode, completedNodes, iteration, interruptNode }) {
  const getNodeStatus = (nodeId) => {
    if (interruptNode === nodeId) return 'interrupt'
    if (activeNode === nodeId) return 'active'
    if (completedNodes.includes(nodeId)) return 'completed'
    return 'idle'
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 h-fit sticky top-16 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workflow Graph
        </h2>
        <AnimatePresence>
          {iteration > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"
            >
              Review {iteration}/2
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-1">
        {nodes.map((node, index) => {
          const status = getNodeStatus(node.id)
          const Icon = ICON_MAP[node.icon] || PenLine
          const isRevise = node.id === 'revise_article'
          const isReview = node.id === 'review_draft'

          const showArrowAfter = index < nodes.length - 1 && !isRevise
          const showCycleArrow = isRevise

          return (
            <div key={node.id} className="w-full flex flex-col items-center">
              <motion.div
                layout
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-300 relative
                  ${status === 'interrupt'
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : status === 'active'
                      ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : status === 'completed'
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700/50 bg-slate-800/50'
                  }
                `}
              >
                {status === 'active' && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-400"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${status === 'interrupt' ? 'bg-amber-500/20 text-amber-400'
                    : status === 'active' ? 'bg-blue-500/20 text-blue-400'
                      : status === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-500'}
                `}>
                  {status === 'interrupt' ? (
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Hand className="w-4 h-4" />
                    </motion.div>
                  ) : status === 'completed' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  ) : status === 'active' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <Icon className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <span className={`text-sm font-medium ${status === 'interrupt' ? 'text-amber-300' : status === 'active' ? 'text-blue-300' : status === 'completed' ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {node.label}
                </span>

                {status === 'active' && (
                  <motion.div
                    className="ml-auto"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  </motion.div>
                )}
              </motion.div>

              {isReview && (
                <div className="flex items-center gap-1 py-0.5">
                  <span className="text-[9px] font-bold text-amber-400/70">NEIN ↓</span>
                  <span className="text-slate-700 text-[9px]">|</span>
                  <span className="text-[9px] font-bold text-emerald-400/70">JA ↓↓</span>
                </div>
              )}

              {showCycleArrow && (
                <div className="flex items-center gap-1 py-0.5 text-amber-400/60">
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-[9px] font-semibold">zurück zu &quot;Entwurf schreiben&quot;</span>
                </div>
              )}

              {showArrowAfter && !isReview && (
                <ArrowDown className="w-3.5 h-3.5 text-slate-600 my-0.5" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
