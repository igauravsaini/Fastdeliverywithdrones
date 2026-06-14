import { useMemo } from 'react';
import { GRID_COLS, GRID_ROWS, CELL, ZONES, WORKSTATION, DISPATCH_PAD, ALL_SHELVES } from '../engine/warehouse.js';

export default function WarehouseView({ grid, robots, drones, selectedOrderId, orders }) {
  // Find selected order's robot for highlighting
  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedRobotId = selectedOrder?.robotId;

  // Collect active paths for rendering
  const robotPaths = useMemo(() => {
    return robots.filter(r => r.path.length > 0).map(r => ({
      id: r.id,
      path: r.path,
      pathIndex: r.pathIndex,
      isSelected: r.id === selectedRobotId,
    }));
  }, [robots, selectedRobotId]);

  return (
    <div className="warehouse-container">
      <div className="warehouse-title">🏭 Warehouse Floor — 3D Simulation</div>
      <div className="warehouse-perspective">
        <div className="warehouse-grid" style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}>
          {/* Grid cells */}
          {grid.map((row, r) => row.map((cell, c) => {
            let className = 'grid-cell';
            let zoneStyle = {};
            let content = null;

            if (cell.zone) {
              const z = ZONES[cell.zone];
              zoneStyle = { background: z.bg, borderColor: z.color + '15' };
              className += ` zone-${cell.zone}`;
            }

            if (cell.type === CELL.SHELF) {
              className += ' cell-shelf';
              const zone = cell.zone;
              const zColor = zone ? ZONES[zone].color : '#64748b';
              content = (
                <div className="shelf-pod" style={{ borderColor: zColor, background: zColor + '18' }}>
                  <span className="shelf-label">{cell.shelfId}</span>
                </div>
              );
            } else if (cell.type === CELL.WORKSTATION) {
              className += ' cell-workstation';
              if (r === WORKSTATION.row && c === WORKSTATION.col) {
                content = <div className="workstation-marker">👷 WS</div>;
              }
            } else if (cell.type === CELL.DISPATCH) {
              className += ' cell-dispatch';
              if (r === DISPATCH_PAD.row && c === DISPATCH_PAD.col) {
                content = <div className="dispatch-marker">🚀 DP</div>;
              }
            } else if (cell.type === CELL.CHARGING) {
              className += ' cell-charging';
              content = <div className="charging-marker">⚡</div>;
            }

            return (
              <div key={`${r}-${c}`} className={className} style={zoneStyle}
                data-row={r} data-col={c}>
                {content}
              </div>
            );
          }))}

          {/* Robot path trails */}
          {robotPaths.map(rp => (
            rp.path.slice(rp.pathIndex).map((p, i) => (
              <div key={`path-${rp.id}-${i}`} className={`path-dot ${rp.isSelected ? 'path-selected' : ''}`}
                style={{
                  gridColumn: p.col + 1,
                  gridRow: p.row + 1,
                }} />
            ))
          ))}

          {/* Robots */}
          {robots.map(robot => (
            <div key={robot.id}
              className={`robot-sprite ${robot.carryingPod ? 'carrying' : ''} ${robot.id === selectedRobotId ? 'robot-selected' : ''}`}
              style={{
                gridColumn: robot.col + 1,
                gridRow: robot.row + 1,
                transition: 'grid-column 0.3s ease, grid-row 0.3s ease',
              }}>
              <div className="robot-body">
                <span className="robot-icon">🤖</span>
                {robot.carryingPod && <span className="pod-indicator">📦</span>}
              </div>
              <span className="robot-label">{robot.id.split('-')[1]}</span>
            </div>
          ))}

          {/* Drones orbiting dispatch pad */}
          {drones.filter(d => d.state === 'DOCKED' || d.state === 'LOADING').map((drone, i) => (
            <div key={drone.id} className="drone-orbit"
              style={{
                gridColumn: DISPATCH_PAD.col + 1,
                gridRow: DISPATCH_PAD.row + 1,
                animationDelay: `${i * 1.3}s`,
              }}>
              <span className="drone-icon">🛸</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
