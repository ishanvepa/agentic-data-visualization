import useStore from '../store';
import ChartRenderer from './ChartRenderer';

export default function Dashboard() {
  const { charts, status } = useStore();

  if (status === 'idle') {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">📊</div>
          <div className="dashboard-empty-text">No visualizations yet</div>
          <div className="dashboard-empty-hint">Upload a file and let AI pick the best charts</div>
        </div>
      </div>
    );
  }

  if ((status === 'uploading' || status === 'streaming') && charts.length === 0) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon" style={{ animation: 'pulse 1.5s ease infinite' }}>🤖</div>
          <div className="dashboard-empty-text">Agent is analyzing your data...</div>
          <div className="dashboard-empty-hint">Charts will appear here when ready</div>
        </div>
      </div>
    );
  }

  if (charts.length === 0 && status === 'error') {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">⚠️</div>
          <div className="dashboard-empty-text">Something went wrong</div>
          <div className="dashboard-empty-hint">Check the agent log on the left</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="charts-header">
        <div className="charts-title">Visualizations</div>
        <div className="charts-count">{charts.length} chart{charts.length !== 1 ? 's' : ''} generated</div>
      </div>
      <div className="charts-grid">
        {charts.map((spec, i) => (
          <ChartRenderer key={i} spec={spec} index={i} />
        ))}
      </div>
    </div>
  );
}
