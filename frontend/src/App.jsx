import { useState, useCallback, useRef } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import WorkflowPanel from './components/WorkflowPanel'
import OutputPanel from './components/OutputPanel'
import StateInspector from './components/StateInspector'
import CodeView from './components/CodeView'
import InterruptOverlay from './components/InterruptOverlay'

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
  const [streamingText, setStreamingText] = useState('')
  const [streamingNode, setStreamingNode] = useState(null)
  const [currentState, setCurrentState] = useState(null)
  const [changedKeys, setChangedKeys] = useState([])
  const [iteration, setIteration] = useState(0)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [interruptData, setInterruptData] = useState(null)
  const [nodeReads, setNodeReads] = useState([])
  const [nodeWrites, setNodeWrites] = useState([])

  const eventSourceRef = useRef(null)

  const resetState = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setActiveNode(null)
    setCompletedNodes([])
    setOutputBlocks([])
    setStreamingText('')
    setStreamingNode(null)
    setCurrentState(null)
    setChangedKeys([])
    setIteration(0)
    setError(null)
    setSessionId(null)
    setInterruptData(null)
    setNodeReads([])
    setNodeWrites([])
  }, [])

  const connectToStream = useCallback((url) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('session', (e) => {
      setSessionId(JSON.parse(e.data).session_id)
    })

    es.addEventListener('state_init', (e) => {
      setCurrentState(JSON.parse(e.data))
    })

    es.addEventListener('node_start', (e) => {
      const data = JSON.parse(e.data)
      setActiveNode(data.node)
      setStreamingNode(data.node)
      setStreamingText('')
      setChangedKeys([])
      setNodeReads(data.reads || [])
      setNodeWrites(data.writes || [])
      // Remove from completed if re-entering (cycle)
      setCompletedNodes((prev) => prev.filter((n) => n !== data.node))
    })

    es.addEventListener('token', (e) => {
      const data = JSON.parse(e.data)
      setStreamingText((prev) => prev + data.content)
    })

    es.addEventListener('node_update', (e) => {
      const data = JSON.parse(e.data)

      setActiveNode(null)
      setStreamingNode(null)
      setStreamingText('')
      setCompletedNodes((prev) =>
        prev.includes(data.node) ? prev : [...prev, data.node]
      )
      setOutputBlocks((prev) => [
        ...prev,
        {
          node: data.node,
          output: data.output,
          iteration: data.iteration,
          timestamp: new Date().toLocaleTimeString('de-DE'),
        },
      ])
      setCurrentState(data.state)
      setChangedKeys(data.changed_keys || [])
      setNodeReads(data.reads || [])
      setNodeWrites(data.writes || [])
      setIteration(data.iteration || 0)
    })

    es.addEventListener('interrupt', (e) => {
      const data = JSON.parse(e.data)
      es.close()
      eventSourceRef.current = null
      setIsRunning(false)
      setActiveNode(data.node)
      setStreamingNode(null)
      setStreamingText('')
      setInterruptData(data)
      if (data.state) setCurrentState(data.state)
      setNodeReads(data.reads || [])
      setNodeWrites(data.writes || [])
    })

    es.addEventListener('done', () => {
      es.close()
      eventSourceRef.current = null
      setIsRunning(false)
      setActiveNode(null)
      setNodeReads([])
      setNodeWrites([])
    })

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      setIsRunning(false)
      setActiveNode(null)
      setError('Verbindung zum Backend verloren. Läuft der Server auf Port 8000?')
    }
  }, [])

  const startResearch = useCallback(
    (question) => {
      resetState()
      setIsRunning(true)
      connectToStream(`/research?question=${encodeURIComponent(question)}`)
    },
    [resetState, connectToStream]
  )

  const handleResume = useCallback(
    async (value) => {
      setInterruptData(null)
      setIsRunning(true)

      await fetch(`/research/${sessionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })

      connectToStream(`/research/${sessionId}/stream`)
    },
    [sessionId, connectToStream]
  )

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
            interruptNode={interruptData?.node}
          />

          {/* Center: Output + Code */}
          <div className="flex flex-col gap-4 min-w-0">
            <OutputPanel
              blocks={outputBlocks}
              isRunning={isRunning}
              activeNode={activeNode}
              streamingText={streamingText}
              streamingNode={streamingNode}
            />
            {interruptData && (
              <InterruptOverlay data={interruptData} onResume={handleResume} />
            )}
            <CodeView
              activeNode={activeNode}
              lastCompletedNode={
                outputBlocks.length > 0
                  ? outputBlocks[outputBlocks.length - 1].node
                  : null
              }
            />
          </div>

          {/* Right: State Inspector */}
          <StateInspector
            state={currentState}
            changedKeys={changedKeys}
            nodeReads={nodeReads}
            nodeWrites={nodeWrites}
          />
        </div>
      </div>
    </div>
  )
}
