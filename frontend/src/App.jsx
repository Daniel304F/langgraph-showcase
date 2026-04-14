import { useState, useCallback } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import WorkflowPanel from './components/WorkflowPanel'
import OutputPanel from './components/OutputPanel'
import StateInspector from './components/StateInspector'
import CodeView from './components/CodeView'

const WORKFLOW_NODES = [
  { id: 'understand_topic', label: 'Thema verstehen', icon: 'search' },
  { id: 'evaluate_sources', label: 'Quellen bewerten', icon: 'book' },
  { id: 'check_quality', label: 'Qualität prüfen', icon: 'check-circle' },
  { id: 'refine_topic', label: 'Thema verfeinern', icon: 'refresh' },
  { id: 'summarize', label: 'Zusammenfassen', icon: 'file-text' },
  { id: 'generate_report', label: 'Report erstellen', icon: 'clipboard' },
]

export default function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [activeNode, setActiveNode] = useState(null)
  const [completedNodes, setCompletedNodes] = useState([])
  const [outputBlocks, setOutputBlocks] = useState([])
  const [currentState, setCurrentState] = useState(null)
  const [changedKeys, setChangedKeys] = useState([])
  const [iteration, setIteration] = useState(0)
  const [error, setError] = useState(null)

  const resetState = useCallback(() => {
    setActiveNode(null)
    setCompletedNodes([])
    setOutputBlocks([])
    setCurrentState(null)
    setChangedKeys([])
    setIteration(0)
    setError(null)
  }, [])

  const startResearch = useCallback((question) => {
    resetState()
    setIsRunning(true)

    const url = `/research?question=${encodeURIComponent(question)}`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('state_init', (e) => {
      const data = JSON.parse(e.data)
      setCurrentState(data)
    })

    eventSource.addEventListener('node_start', (e) => {
      const data = JSON.parse(e.data)
      setActiveNode(data.node)
      setChangedKeys([])
    })

    eventSource.addEventListener('node_update', (e) => {
      const data = JSON.parse(e.data)

      setActiveNode(null)
      setCompletedNodes((prev) => {
        if (prev.includes(data.node)) return prev
        return [...prev, data.node]
      })

      setOutputBlocks((prev) => [...prev, {
        node: data.node,
        output: data.output,
        iteration: data.iteration,
        timestamp: new Date().toLocaleTimeString('de-DE'),
      }])

      setCurrentState(data.state)
      setChangedKeys(data.changed_keys || [])
      setIteration(data.iteration || 0)
    })

    eventSource.addEventListener('done', () => {
      eventSource.close()
      setIsRunning(false)
      setActiveNode(null)
    })

    eventSource.onerror = () => {
      eventSource.close()
      setIsRunning(false)
      setActiveNode(null)
      setError('Verbindung zum Backend verloren. Läuft der Server auf Port 8000?')
    }
  }, [resetState])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-4 pb-4 max-w-[1600px] mx-auto w-full">
        <InputSection onSubmit={startResearch} isRunning={isRunning} />

        {error && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4">
          {/* Left: Workflow */}
          <WorkflowPanel
            nodes={WORKFLOW_NODES}
            activeNode={activeNode}
            completedNodes={completedNodes}
            iteration={iteration}
          />

          {/* Center: Output + Code */}
          <div className="flex flex-col gap-4 min-w-0">
            <OutputPanel blocks={outputBlocks} isRunning={isRunning} activeNode={activeNode} />
            <CodeView activeNode={activeNode} lastCompletedNode={outputBlocks.length > 0 ? outputBlocks[outputBlocks.length - 1].node : null} />
          </div>

          {/* Right: State Inspector */}
          <StateInspector state={currentState} changedKeys={changedKeys} />
        </div>
      </div>
    </div>
  )
}
