// import React from 'react'
// import TreeVisualizer from './TreeVisualizer.jsx'

// function App() {
//   return (
//     <div>
//       <TreeVisualizer />
//     </div>
//   )
// }

// export default App
import React from 'react'
import TreeVisualizer from './TreeVisualizer'

export default function App(){
  return (
    <div className="app-root">
      <header className="header">
        <h1>JSON Tree Visualizer</h1>
        <p>Paste JSON, visualize with React Flow, search by path (e.g. $.user.name or items[0].id)</p>
      </header>
      <main>
        <TreeVisualizer />
      </main>
    </div>
  )
}