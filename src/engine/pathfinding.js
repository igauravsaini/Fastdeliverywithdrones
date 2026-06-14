// ─── A* Pathfinding Algorithm ────────────────────────────────────────
// Grid-based navigation with obstacle avoidance for swarm robots

import { GRID_ROWS, GRID_COLS, CELL } from './warehouse.js';

class MinHeap {
  constructor() {
    this.data = [];
  }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  get size() { return this.data.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f < this.data[parent].f) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else break;
    }
  }
}

// Manhattan distance heuristic
function heuristic(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

// 4-directional neighbors
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * A* pathfinding on the warehouse grid
 * @param {Array} grid - 2D grid from warehouse.js
 * @param {Object} start - {row, col}
 * @param {Object} end - {row, col}
 * @param {Array} occupiedCells - [{row, col}] cells occupied by other robots
 * @returns {Array|null} - Array of {row, col} from start to end, or null if no path
 */
export function findPath(grid, start, end, occupiedCells = []) {
  const occupiedSet = new Set(occupiedCells.map(c => `${c.row},${c.col}`));

  // Check if cell is walkable for pathfinding
  const canWalk = (r, c) => {
    if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return false;
    // Allow walking to the destination even if it's a shelf (we walk adjacent)
    if (r === end.row && c === end.col) return true;
    const cell = grid[r][c];
    if (cell.type === CELL.SHELF || cell.type === CELL.WALL) return false;
    if (occupiedSet.has(`${r},${c}`)) return false;
    return true;
  };

  const open = new MinHeap();
  const gScore = new Map();
  const cameFrom = new Map();
  const closed = new Set();

  const startKey = `${start.row},${start.col}`;
  gScore.set(startKey, 0);
  open.push({
    row: start.row,
    col: start.col,
    f: heuristic(start.row, start.col, end.row, end.col),
    g: 0,
  });

  while (open.size > 0) {
    const current = open.pop();
    const key = `${current.row},${current.col}`;

    if (current.row === end.row && current.col === end.col) {
      // Reconstruct path
      const path = [];
      let k = key;
      while (k) {
        const [r, c] = k.split(',').map(Number);
        path.unshift({ row: r, col: c });
        k = cameFrom.get(k);
      }
      return path;
    }

    if (closed.has(key)) continue;
    closed.add(key);

    for (const [dr, dc] of DIRS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const nKey = `${nr},${nc}`;

      if (!canWalk(nr, nc) || closed.has(nKey)) continue;

      const tentG = current.g + 1;
      const prevG = gScore.get(nKey) ?? Infinity;

      if (tentG < prevG) {
        gScore.set(nKey, tentG);
        cameFrom.set(nKey, key);
        open.push({
          row: nr,
          col: nc,
          f: tentG + heuristic(nr, nc, end.row, end.col),
          g: tentG,
        });
      }
    }
  }

  return null; // No path found
}

/**
 * Find the nearest walkable cell adjacent to a target (for shelf pods)
 * Robots can't stand ON shelves, they stand next to them
 */
export function findAdjacentWalkable(grid, target) {
  for (const [dr, dc] of DIRS) {
    const r = target.row + dr;
    const c = target.col + dc;
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      const cell = grid[r][c];
      if (cell.type !== CELL.SHELF && cell.type !== CELL.WALL) {
        return { row: r, col: c };
      }
    }
  }
  // Fallback: return the target itself
  return target;
}

/**
 * Smooth a path by removing unnecessary waypoints
 */
export function smoothPath(path) {
  if (!path || path.length <= 2) return path;
  const smoothed = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];
    // Keep waypoint if direction changes
    const dr1 = curr.row - prev.row;
    const dc1 = curr.col - prev.col;
    const dr2 = next.row - curr.row;
    const dc2 = next.col - curr.col;
    if (dr1 !== dr2 || dc1 !== dc2) {
      smoothed.push(curr);
    }
  }
  smoothed.push(path[path.length - 1]);
  return smoothed;
}
