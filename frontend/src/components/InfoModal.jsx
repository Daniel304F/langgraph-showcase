import { motion } from 'framer-motion'
import {
  X, Workflow, PenLine, Link2, Eye, RefreshCw, Sparkles,
  Database, Hand, Zap, ListChecks,
} from 'lucide-react'

const STEPS = [
  {
    icon: ListChecks,
    title: '1. Outline planen',
    desc: 'Das LLM schlägt eine Gliederung für deinen Blogartikel vor. Du bearbeitest sie direkt im Browser – Abschnitte umformulieren, löschen oder neue hinzufügen.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Link2,
    title: '2. Quellen sammeln',
    desc: 'Der Assistent schlägt Quellentypen vor. Du hinterlegst deine eigenen Links, Studien oder Notizen – sie fließen direkt in den Artikel ein.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: PenLine,
    title: '3. Entwurf schreiben',
    desc: 'Basierend auf Outline und Quellen wird ein erster Entwurf als Markdown geschrieben. Quellen werden im Text referenziert.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Eye,
    title: '4. Entwurf prüfen',
    desc: 'Du liest den Entwurf und entscheidest: freigeben oder Feedback formulieren. Deine Hinweise fließen in die nächste Iteration.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: RefreshCw,
    title: '5. Überarbeiten (Zyklus)',
    desc: 'Ist der Entwurf noch nicht fertig, kehrt der Graph zum Schreib-Node zurück – maximal zweimal. Der Zyklus ist im LangGraph sichtbar.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Sparkles,
    title: '6. Finalisieren',
    desc: 'Die letzte Stufe erstellt Titel, Meta-Description und Tags – veröffentlichungsreif als Markdown.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

const CONCEPTS = [
  {
    icon: Workflow,
    title: 'StateGraph',
    text: 'Der Workflow ist ein gerichteter Graph aus typisierten Nodes. Jeder Node liest und schreibt Teile eines geteilten State-Objekts.',
  },
  {
    icon: Database,
    title: 'Typed State',
    text: 'Ein TypedDict definiert, welche Felder existieren. Die rechte Spalte zeigt live, welche Keys ein Node gerade liest oder schreibt.',
  },
  {
    icon: RefreshCw,
    title: 'Conditional Edges & Zyklen',
    text: 'Nach dem Review entscheidet eine Router-Funktion, ob der Graph zum Schreib-Node zurückspringt oder zur Finalisierung weitergeht.',
  },
  {
    icon: Hand,
    title: 'Human-in-the-Loop',
    text: 'Mit interrupt() pausiert der Graph mitten im Lauf. Der User-Input wird über einen Checkpoint geladen – der Graph setzt exakt dort fort.',
  },
  {
    icon: Zap,
    title: 'Streaming',
    text: 'Token und Node-Updates werden live über Server-Sent Events an das Frontend gestreamt – der Workflow ist in Echtzeit beobachtbar.',
  },
]

export default function InfoModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-transparent">
          <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <PenLine className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100">LangGraph Blog Writer</h2>
            <p className="text-xs text-slate-500">
              Ein interaktiver Blog-Workflow als LangGraph-Demo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Über das Projekt */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Worum geht es?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Diese Demo zeigt, wie <span className="text-sky-400 font-medium">LangGraph</span> einen
              mehrstufigen, zustandsbehafteten Workflow mit Zyklen und echten Human-in-the-Loop-Stopps
              umsetzen kann – am Beispiel eines <span className="text-sky-400 font-medium">Blogartikel-Assistenten</span>.
              Anstatt stur einen Text zu generieren, arbeitet der Workflow iterativ mit dir: du bearbeitest
              die Outline, hinterlegst eigene Quellen und gibst Feedback zum Entwurf. Der Graph springt bei
              Bedarf zurück und überarbeitet den Text.
            </p>
          </section>

          {/* Workflow-Schritte */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Der Workflow
            </h3>
            <div className="space-y-2">
              {STEPS.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.title}
                    className="flex gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className={`w-9 h-9 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${step.color}`}>{step.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* LangGraph Konzepte */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Was du an der Demo lernst
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONCEPTS.map((c) => {
                const Icon = c.icon
                return (
                  <div
                    key={c.title}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs font-semibold text-slate-200">{c.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{c.text}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Layout */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Das Layout
            </h3>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="font-semibold text-blue-400 mb-1">Links</p>
                <p className="text-slate-400 leading-relaxed">
                  Der Workflow-Graph mit allen Nodes. Aktive Knoten pulsieren, abgeschlossene
                  erhalten einen Haken, der Zyklus ist sichtbar.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="font-semibold text-sky-400 mb-1">Mitte</p>
                <p className="text-slate-400 leading-relaxed">
                  Live-Output jedes Nodes, Human-in-the-Loop-Dialoge und der zugehörige
                  Python-Code aus nodes.py.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="font-semibold text-violet-400 mb-1">Rechts</p>
                <p className="text-slate-400 leading-relaxed">
                  Der aktuelle BlogState. Du siehst, welche Felder ein Node als Input liest
                  und als Output schreibt.
                </p>
              </div>
            </div>
          </section>

          {/* Tech */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {['LangGraph', 'LangChain', 'FastAPI', 'SSE', 'React 19', 'Tailwind 4', 'Framer Motion'].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-600 font-mono">
            Demo für einen Hochschulvortrag über LangGraph
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
          >
            Verstanden
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
