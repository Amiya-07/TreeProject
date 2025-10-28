import React, { useCallback, useState, useRef, useEffect } from 'react'
import ReactFlow, {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Controls,
  Background,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Utility for IDs
let idCounter = 1
const genId = () => `node_${idCounter++}`

// Node colors
const COLORS = {
  object: '#6c5ce7',
  array: '#00b894',
  primitive: '#fd9644',
  highlight: '#ff4757'
}

// Build tree structure
function buildTree(json, rootKey = '$') {
  idCounter = 1
  const nodes = []
  const edges = []
  const layout = { xOffset: 220, yOffset: 110 }

  function recurse(value, path, depth, parentId) {
    const id = genId()
    const type = Array.isArray(value)
      ? 'array'
      : value !== null && typeof value === 'object'
      ? 'object'
      : 'primitive'

    const label =
      type === 'object'
        ? `${path.split('.').slice(-1)[0]} {object}`
        : type === 'array'
        ? `${path.split('.').slice(-1)[0]} [array]`
        : `${path.split('.').slice(-1)[0]}: ${String(value)}`

    if (!layout[`col_${depth}`]) layout[`col_${depth}`] = 0
    const x = layout[`col_${depth}`] * layout.xOffset
    const y = depth * layout.yOffset
    layout[`col_${depth}`]++

    nodes.push({
      id,
      data: { label, path, value, type },
      position: { x, y },
      style: {
        border: `2px solid ${
          type === 'primitive'
            ? COLORS.primitive
            : type === 'array'
            ? COLORS.array
            : COLORS.object
        }`,
        borderRadius: 8,
        padding: 8,
        background: '#fff'
      }
    })

    if (parentId) {
      edges.push({ id: `e_${parentId}_${id}`, source: parentId, target: id })
    }

    if (type === 'object') {
      Object.keys(value).forEach((k) =>
        recurse(value[k], `${path}.${k}`, depth + 1, id)
      )
    } else if (type === 'array') {
      value.forEach((v, i) => recurse(v, `${path}[${i}]`, depth + 1, id))
    }
  }

  recurse(json, rootKey, 0, null)
  return { nodes, edges }
}

function findNodeByPath(nodes, path) {
  const normalized = path.trim().startsWith('$')
    ? path.trim()
    : `$${path.trim().startsWith('.') ? '' : '.'}${path.trim()}`
  return nodes.find((n) => n.data.path === normalized)
}

export default function TreeVisualizer() {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [highlight, setHighlight] = useState(null)
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(false)
  const reactFlowRef = useRef(null)

  const onNodesChange = useCallback(
    (changes) => setNodes((ns) => applyNodeChanges(changes, ns)),
    []
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges((es) => applyEdgeChanges(changes, es)),
    []
  )

  function handleVisualize() {
    try {
      const parsed = JSON.parse(jsonText)
      const { nodes, edges } = buildTree(parsed)
      setNodes(nodes)
setEdges(edges)
setError(null)
setMessage('Tree generated successfully')

// Auto-fit the view to show all nodes
setTimeout(() => {
  const flow = document.querySelector('.react-flow__viewport')
  if (flow && window.dispatchEvent) {
    window.dispatchEvent(new Event('resize'))
  }
}, 300)

    } catch (e) {
      setError('Invalid JSON: ' + e.message)
    }
  }

  function handleSample() {
    const sample = `{
  "user": { "name": "Alice", "age": 30, "address": { "city": "Mumbai" } },
  "items": [{ "name": "Pen" }, { "name": "Book" }],
  "active": true
}`
    setJsonText(sample)
  }

  function handleSearch(query) {
    const found = findNodeByPath(nodes, query)
    if (found) {
      setHighlight(found.id)
      setMessage('Match found!')
    } else {
      setHighlight(null)
      setMessage('No match found')
    }
  }

  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        style: {
          ...n.style,
          border: `2px solid ${
            highlight === n.id ? COLORS.highlight : COLORS[n.data.type]
          }`
        }
      }))
    )
  }, [highlight])

  return (
    <div className={'tf-root ' + (dark ? 'dark' : '')}>
      <div className="controls-panel">
        <div className="left">
          <button onClick={handleSample}>Load Sample</button>
          <button onClick={handleVisualize}>Visualize</button>
          <label className="switch">
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
            />{' '}
            Dark
          </label>
        </div>
        <div className="right">
          <input
            id="searchInput"
            placeholder="Search path (e.g. $.user.address.city)"
            onKeyDown={(e) =>
              e.key === 'Enter' && handleSearch(e.target.value)
            }
          />
          <button
            onClick={() =>
              handleSearch(document.getElementById('searchInput').value)
            }
          >
            Search
          </button>
        </div>
      </div>

      <div className="main-grid">
        <div className="editor">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste JSON here"
          ></textarea>
          <div className="status">
            {error && <span className="error">{error}</span>}
            {message && <span className="msg">{message}</span>}
          </div>
        </div>

        <div className="viewer" ref={reactFlowRef}>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              style: {
                ...n.style,
                background: dark ? '#111827' : '#fff',
                color: dark ? '#fff' : '#000'
              }
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(p) => setEdges((es) => addEdge(p, es))}
            fitView
            style={{ width: '100%', height: '100%' }}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
