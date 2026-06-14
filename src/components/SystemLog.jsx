import { useRef, useEffect } from 'react';

export default function SystemLog({ logs }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  const typeColor = { info: '#94a3b8', success: '#22c55e', warning: '#eab308', error: '#ef4444' };

  return (
    <div className="system-log">
      <div className="panel-subtitle">System Log</div>
      <div className="log-entries">
        {logs.slice(-40).map(log => (
          <div key={log.id} className="log-entry">
            <span className="log-time">{log.time}</span>
            <span className="log-dot" style={{ background: typeColor[log.type] || '#94a3b8' }} />
            <span className="log-msg" style={{ color: typeColor[log.type] || '#94a3b8' }}>{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
