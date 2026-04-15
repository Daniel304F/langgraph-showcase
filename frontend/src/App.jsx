import { useState, useCallback, useRef } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import WorkflowPanel from './components/WorkflowPanel'
import OutputPanel from './components/OutputPanel'
import StateInspector from './components/StateInspector'
import CodeView from './components/CodeView'
import InterruptOverlay from './components/InterruptOverlay'
import InfoModal from './components/InfoModal'

const WORKFLOW_NODES = [
  { id: 'plan_outline', label: 'Outline planen', icon: 'list' },
  { id: 'collect_sources', label: 'Quellen sammeln', icon: 'link' },
  { id: 'draft_article', label: 'Entwurf schreiben', icon: 'pen' },
  { id: 'review_draft', label: 'Entwurf prüfen', icon: 'eye' },
  { id: 'revise_article', label: 'Überarbeiten', icon: 'refresh' },
  { id: 'finalize', label: 'Finalisieren', icon: 'sparkles' },
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
  const [showInfo, setShowInfo] = useState(false)

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

  const startBlog = useCallback(
    ({ topic, audience }) => {
      resetState()
      setIsRunning(true)
      const params = new URLSearchParams({ topic, audience: audience || '' })
      connectToStream(`/blog?${params.toString()}`)
    },
    [resetState, connectToStream]
  )

  const handleResume = useCallback(
    async (value) => {
      setInterruptData(null)
      setIsRunning(true)

      await fetch(`/blog/${sessionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })

      connectToStream(`/blog/${sessionId}/stream`)
    },
    [sessionId, connectToStream]
  )

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header onInfoClick={() => setShowInfo(true)} />

      <div className="px-4 pt-1 pb-6 max-w-[1600px] mx-auto w-full">
        <InputSection onSubmit={startBlog} isRunning={isRunning} />

        {error && (
          <div className="mb-4 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4">
          <WorkflowPanel
            nodes={WORKFLOW_NODES}
            activeNode={activeNode}
            completedNodes={completedNodes}
            iteration={iteration}
            interruptNode={interruptData?.node}
          />

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

          <StateInspector
            state={currentState}
            changedKeys={changedKeys}
            nodeReads={nodeReads}
            nodeWrites={nodeWrites}
          />
        </div>
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  )
}
