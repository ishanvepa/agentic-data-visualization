import './index.css';
import FileUpload from './components/FileUpload';
import AgentStream from './components/AgentStream';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">✦</div>
        <div>
          <div className="header-title">DataLens</div>
          <div className="header-subtitle">Agentic Data Visualization</div>
        </div>
        <div className="header-badge">AI Powered</div>
      </header>

      {/* Main */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <FileUpload />
          <AgentStream />
        </aside>

        {/* Chart area */}
        <main>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
