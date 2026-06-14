// ─── Warehouse Grid Configuration ───────────────────────────────────
// 20 columns × 16 rows grid. Each cell is ~50px rendered.
// Zones: A (Aichi/Blue), B (Osaka/Green), C (Kyoto/Orange)

export const GRID_COLS = 20;
export const GRID_ROWS = 16;
export const CELL_SIZE = 48;

// Cell types
export const CELL = {
  EMPTY: 0,
  SHELF: 1,
  WALL: 2,
  WORKSTATION: 3,
  DISPATCH: 4,
  CHARGING: 5,
  PATH: 6,
};

// Zone definitions with colors
export const ZONES = {
  A: { name: 'Aichi', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', label: 'A', region: 'Aichi Prefecture' },
  B: { name: 'Osaka', color: '#22c55e', bg: 'rgba(34,197,94,0.10)', label: 'B', region: 'Osaka Prefecture' },
  C: { name: 'Kyoto', color: '#f97316', bg: 'rgba(249,115,22,0.10)', label: 'C', region: 'Kyoto Prefecture' },
};

// Shelf pod positions per zone  [row, col, shelfId]
export const SHELVES = {
  A: [
    { id: 'A-01', row: 2, col: 2 }, { id: 'A-02', row: 2, col: 4 },
    { id: 'A-03', row: 4, col: 2 }, { id: 'A-04', row: 4, col: 4 },
    { id: 'A-05', row: 6, col: 2 }, { id: 'A-06', row: 6, col: 4 },
    { id: 'A-07', row: 2, col: 6 }, { id: 'A-08', row: 4, col: 6 },
  ],
  B: [
    { id: 'B-01', row: 2, col: 9 },  { id: 'B-02', row: 2, col: 11 },
    { id: 'B-03', row: 4, col: 9 },  { id: 'B-04', row: 4, col: 11 },
    { id: 'B-05', row: 6, col: 9 },  { id: 'B-06', row: 6, col: 11 },
    { id: 'B-07', row: 2, col: 13 }, { id: 'B-08', row: 4, col: 13 },
  ],
  C: [
    { id: 'C-01', row: 10, col: 2 },  { id: 'C-02', row: 10, col: 4 },
    { id: 'C-03', row: 12, col: 2 },  { id: 'C-04', row: 12, col: 4 },
    { id: 'C-05', row: 10, col: 6 },  { id: 'C-06', row: 12, col: 6 },
    { id: 'C-07', row: 10, col: 9 },  { id: 'C-08', row: 12, col: 9 },
  ],
};

// All shelf positions as flat array
export const ALL_SHELVES = [...SHELVES.A, ...SHELVES.B, ...SHELVES.C];

// Workstation position (where human verifies)
export const WORKSTATION = { row: 8, col: 17, label: 'WS' };

// Dispatch pad (where drones pick up)
export const DISPATCH_PAD = { row: 13, col: 17, label: 'DP' };

// Charging stations
export const CHARGING_STATIONS = [
  { row: 14, col: 0 }, { row: 14, col: 2 }, { row: 14, col: 4 },
];

// Robot home positions
export const ROBOT_HOMES = [
  { row: 14, col: 7 },  { row: 14, col: 9 },  { row: 14, col: 11 },
  { row: 14, col: 13 }, { row: 14, col: 15 }, { row: 14, col: 17 },
];

// Build the grid with zone information
export function buildGrid() {
  const grid = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ type: CELL.EMPTY, zone: null, shelfId: null }))
  );

  // Mark zone regions
  // Zone A: rows 1-7, cols 1-7
  for (let r = 1; r <= 7; r++) {
    for (let c = 1; c <= 7; c++) {
      grid[r][c].zone = 'A';
    }
  }
  // Zone B: rows 1-7, cols 8-14
  for (let r = 1; r <= 7; r++) {
    for (let c = 8; c <= 14; c++) {
      grid[r][c].zone = 'B';
    }
  }
  // Zone C: rows 9-13, cols 1-10
  for (let r = 9; r <= 13; r++) {
    for (let c = 1; c <= 10; c++) {
      grid[r][c].zone = 'C';
    }
  }

  // Place shelves
  ALL_SHELVES.forEach(shelf => {
    grid[shelf.row][shelf.col].type = CELL.SHELF;
    grid[shelf.row][shelf.col].shelfId = shelf.id;
  });

  // Place workstation
  grid[WORKSTATION.row][WORKSTATION.col].type = CELL.WORKSTATION;
  grid[WORKSTATION.row + 1][WORKSTATION.col].type = CELL.WORKSTATION;

  // Place dispatch pad
  grid[DISPATCH_PAD.row][DISPATCH_PAD.col].type = CELL.DISPATCH;
  grid[DISPATCH_PAD.row][DISPATCH_PAD.col - 1].type = CELL.DISPATCH;

  // Place charging stations
  CHARGING_STATIONS.forEach(cs => {
    grid[cs.row][cs.col].type = CELL.CHARGING;
  });

  return grid;
}

// Find shelf by ID
export function findShelf(shelfId) {
  return ALL_SHELVES.find(s => s.id === shelfId) || null;
}

// Get zone for a shelf
export function getShelfZone(shelfId) {
  if (shelfId.startsWith('A')) return 'A';
  if (shelfId.startsWith('B')) return 'B';
  if (shelfId.startsWith('C')) return 'C';
  return null;
}

// Check if a cell is walkable
export function isWalkable(grid, row, col) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
  const cell = grid[row][col];
  return cell.type !== CELL.WALL && cell.type !== CELL.SHELF;
}
