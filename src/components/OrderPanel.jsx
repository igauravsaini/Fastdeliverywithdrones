import { getStageProgress, getStageColor } from '../engine/orderPipeline.js';

export default function OrderPanel({ orders, selectedOrderId, onSelectOrder }) {
  return (
    <div className="order-panel">
      <div className="panel-title">📋 Order Queue</div>
      <div className="order-list">
        {orders.length === 0 && <div className="empty-state">No orders yet. Click + New Order</div>}
        {orders.map(order => {
          const progress = getStageProgress(order.stage);
          const color = getStageColor(order.stage);
          const isSelected = order.id === selectedOrderId;
          return (
            <div key={order.id} className={`order-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectOrder(order.id)} style={{ borderLeftColor: color }}>
              <div className="order-card-header">
                <span className="order-emoji">{order.emoji}</span>
                <div className="order-info">
                  <span className="order-id">{order.id}</span>
                  <span className="order-product">{order.product}</span>
                </div>
                <div className="order-status-dot" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
              </div>
              <div className="order-meta">
                <span className="order-zone">Zone {order.zone}</span>
                <span className="order-shelf">📍 {order.shelf}</span>
                {order.robotId && <span className="order-robot">🤖 {order.robotId}</span>}
                <span className="order-slot">🕐 {order.yamatoSlot}</span>
              </div>
              <div className="order-progress-bar">
                <div className="order-progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
              </div>
              <div className="order-stage-label" style={{ color }}>{order.stage.replace(/_/g,' ')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
