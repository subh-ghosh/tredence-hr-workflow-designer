import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>HR Workflow Designer</h1>
        <p>Increment 1: layout shell ready</p>
      </header>

      <div className="panels">
        <aside className="panel" data-testid="panel-sidebar" aria-label="Node palette">
          <h2>Node Palette</h2>
          <ul>
            <li>Start</li>
            <li>Task</li>
            <li>Approval</li>
            <li>Automated</li>
            <li>End</li>
          </ul>
        </aside>

        <main className="panel panel-canvas" data-testid="panel-canvas" aria-label="Workflow canvas area">
          <h2>Canvas Area</h2>
          <p>React Flow canvas will be implemented in Increment 2.</p>
        </main>

        <aside className="panel" data-testid="panel-details" aria-label="Node details panel">
          <h2>Details and Sandbox</h2>
          <p>Node forms and simulation controls will be added in later increments.</p>
        </aside>
      </div>
    </div>
  )
}

export default App
