import { getRobotStatusColor, getRobotStateLabel } from '../engine/robotManager.js';
import { getDroneStatusColor, RELAY_CHAIN } from '../engine/droneManager.js';
import { ZONES } from '../engine/warehouse.js';

export default function KPIPanel({ orders, robots, drones }) {
  const completed = orders.filter(o => o.stage === 'DELIVERED').length;
  const inProgress = orders.filter(o => o.stage !== 'DELIVERED' && o.stage !== 'PLACED').length;
  const busyRobots = robots.filter(r => r.state !== 'IDLE').length;
  const avgBattery = robots.reduce((s, r) => s + r.battery, 0) / robots.length;

  return (
    <div className="kpi-panel">
      <div className="panel-title">📊 Dashboard</div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-value">{orders.length}</div>
          <div className="kpi-label">Total Orders</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-value">{completed}</div>
          <div className="kpi-label">Delivered</div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-value">{inProgress}</div>
          <div className="kpi-label">In Progress</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-value">{busyRobots}/{robots.length}</div>
          <div className="kpi-label">Active Robots</div>
        </div>
      </div>

      {/* Robot Fleet */}
      <div className="panel-subtitle">🤖 Robot Fleet</div>
      <div className="robot-fleet">
        {robots.map(robot => (
          <div key={robot.id} className="robot-status-card">
            <div className="robot-status-header">
              <span className="robot-name">{robot.id}</span>
              <span className="robot-state-badge" style={{ background: getRobotStatusColor(robot.state)+'20', color: getRobotStatusColor(robot.state) }}>
                {getRobotStateLabel(robot.state)}
              </span>
            </div>
            <div className="robot-stats">
              <span>🔋 {Math.round(robot.battery)}%</span>
              <span>📦 {robot.totalDeliveries}</span>
              {robot.orderId && <span className="robot-order-tag">{robot.orderId}</span>}
            </div>
            <div className="robot-battery-bar">
              <div className="robot-battery-fill" style={{
                width: `${robot.battery}%`,
                background: robot.battery > 50 ? '#22c55e' : robot.battery > 20 ? '#eab308' : '#ef4444'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Drone Fleet */}
      <div className="panel-subtitle">🛸 Drone Fleet</div>
      <div className="drone-fleet">
        {drones.map(drone => (
          <div key={drone.id} className="drone-status-card">
            <div className="drone-status-header">
              <span className="drone-name">{drone.id}</span>
              <span className="drone-state-badge" style={{ background: getDroneStatusColor(drone.state)+'20', color: getDroneStatusColor(drone.state) }}>
                {drone.state}
              </span>
            </div>
            <div className="drone-stats">
              <span>🔋 {Math.round(drone.battery)}%</span>
              <span>✈️ {drone.totalFlights}</span>
              {drone.destination && <span>📍 {drone.destination.name}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Relay Chain */}
      <div className="panel-subtitle">📡 Relay Chain</div>
      <div className="relay-chain">
        {RELAY_CHAIN.map((node, i) => (
          <div key={node.name} className="relay-node">
            <div className="relay-dot">{node.emoji}</div>
            <span className="relay-name">{node.name}</span>
            {i < RELAY_CHAIN.length - 1 && <div className="relay-line" />}
          </div>
        ))}
      </div>

      {/* Zone Legend */}
      <div className="panel-subtitle">🗺️ Zones</div>
      <div className="zone-legend">
        {Object.entries(ZONES).map(([key, zone]) => (
          <div key={key} className="zone-legend-item">
            <div className="zone-color-dot" style={{ background: zone.color }} />
            <span>{zone.label} — {zone.region}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
