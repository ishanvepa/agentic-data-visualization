import { useEffect, useRef } from 'react';
import useStore from '../store';

export default function AgentStream() {
  const { agentSteps, status, errorMsg, rowCount, colCount, filename } = useStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentSteps]);

  const isStreaming = status === 'streaming' || status === 'uploading';

  if (status === 'idle') return null;

  return (
    <>
      {/* Data stats */}
      {rowCount !== null && (
        <div className="card">
          <div className="card-title">Dataset</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filename}
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{rowCount?.toLocaleString()}</div>
              <div className="stat-label">Rows</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{colCount}</div>
              <div className="stat-label">Columns</div>
            </div>
          </div>
        </div>
      )}

      {/* Agent log */}
      <div className="card">
        <div className="card-title">Agent Reasoning</div>
        <div className="agent-stream">
          {agentSteps.map((step, i) => (
            <div key={i} className="agent-step">
              <div className="agent-step-dot" />
              <div className="agent-step-text">{step}</div>
            </div>
          ))}

          {isStreaming && (
            <div className="agent-thinking">
              <div className="pulse-dots">
                <span /><span /><span />
              </div>
              Thinking...
            </div>
          )}

          {status === 'done' && agentSteps.length > 0 && (
            <div className="agent-step">
              <div className="agent-step-dot" style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              <div className="agent-step-text" style={{ color: 'var(--success)' }}>Analysis complete ✓</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {errorMsg && (
          <div className="error-banner" style={{ marginTop: 12 }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </>
  );
}
