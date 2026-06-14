export default function TopBar({ connected, onNewOrder, orderCount }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">SwarmRoute</span>
          <span className="logo-sub">Workstation Dashboard</span>
        </div>
      </div>
      <div className="top-bar-center">
        <button className="new-order-btn" onClick={onNewOrder}>
          <span>+</span> New Order
        </button>
        <div className="order-count-badge">{orderCount} orders</div>
      </div>
      <div className="top-bar-right">
        <div className={`ws-status ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
          <span className="ws-dot" />
          <span>{connected ? 'WS Connected' : 'WS Offline — Demo Mode'}</span>
        </div>
        <div className="top-clock">
          <div className="clock-time">{timeStr}</div>
          <div className="clock-date">{dateStr}</div>
        </div>
      </div>
    </header>
  );
}
