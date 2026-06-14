import { ROBOT_HOMES, WORKSTATION } from './warehouse.js';
import { findPath, findAdjacentWalkable } from './pathfinding.js';

export const ROBOT_STATE = {
  IDLE: 'IDLE',
  NAVIGATING_TO_SHELF: 'NAVIGATING_TO_SHELF',
  LIFTING_POD: 'LIFTING_POD',
  CARRYING_TO_WS: 'CARRYING_TO_WS',
  AT_WORKSTATION: 'AT_WORKSTATION',
  CARRYING_TO_DISPATCH: 'CARRYING_TO_DISPATCH',
  RETURNING_HOME: 'RETURNING_HOME',
};

const ROBOT_NAMES = ['Kiva-01','Kiva-02','Kiva-03','Kiva-04','Kiva-05','Kiva-06'];

export function createRobotFleet() {
  return ROBOT_HOMES.map((home, i) => ({
    id: ROBOT_NAMES[i], row: home.row, col: home.col,
    homeRow: home.row, homeCol: home.col,
    state: ROBOT_STATE.IDLE, orderId: null, shelfId: null,
    path: [], pathIndex: 0, carryingPod: false,
    battery: 85 + Math.floor(Math.random() * 16),
    totalDeliveries: Math.floor(Math.random() * 20),
    liftTimer: 0, wsTimer: 0,
  }));
}

export function findNearestIdleRobot(robots, targetRow, targetCol) {
  let best = null, bestDist = Infinity;
  for (const r of robots) {
    if (r.state !== ROBOT_STATE.IDLE) continue;
    const d = Math.abs(r.row - targetRow) + Math.abs(r.col - targetCol);
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return best;
}

export function assignOrderToRobot(robot, orderId, shelf, grid) {
  const adj = findAdjacentWalkable(grid, { row: shelf.row, col: shelf.col });
  const path = findPath(grid, { row: robot.row, col: robot.col }, adj);
  if (!path) return false;
  robot.state = ROBOT_STATE.NAVIGATING_TO_SHELF;
  robot.orderId = orderId;
  robot.shelfId = shelf.id;
  robot.path = path;
  robot.pathIndex = 0;
  robot.carryingPod = false;
  return true;
}

export function tickRobot(robot, grid) {
  const events = [];
  switch (robot.state) {
    case ROBOT_STATE.NAVIGATING_TO_SHELF:
    case ROBOT_STATE.CARRYING_TO_WS:
    case ROBOT_STATE.CARRYING_TO_DISPATCH:
    case ROBOT_STATE.RETURNING_HOME: {
      if (robot.pathIndex < robot.path.length - 1) {
        robot.pathIndex++;
        const next = robot.path[robot.pathIndex];
        robot.row = next.row; robot.col = next.col;
        robot.battery = Math.max(0, robot.battery - 0.1);
      } else {
        if (robot.state === ROBOT_STATE.NAVIGATING_TO_SHELF) {
          robot.state = ROBOT_STATE.LIFTING_POD; robot.liftTimer = 3;
          events.push({ type:'ROBOT_AT_SHELF', robotId:robot.id, shelfId:robot.shelfId, orderId:robot.orderId });
        } else if (robot.state === ROBOT_STATE.CARRYING_TO_WS) {
          robot.state = ROBOT_STATE.AT_WORKSTATION; robot.wsTimer = 5;
          events.push({ type:'ROBOT_AT_WORKSTATION', robotId:robot.id, orderId:robot.orderId });
        } else if (robot.state === ROBOT_STATE.CARRYING_TO_DISPATCH) {
          robot.carryingPod = false;
          const hp = findPath(grid, {row:robot.row,col:robot.col}, {row:robot.homeRow,col:robot.homeCol});
          if (hp) { robot.path=hp; robot.pathIndex=0; robot.state=ROBOT_STATE.RETURNING_HOME; }
          else robot.state = ROBOT_STATE.IDLE;
          events.push({ type:'POD_AT_DISPATCH', robotId:robot.id, orderId:robot.orderId });
        } else if (robot.state === ROBOT_STATE.RETURNING_HOME) {
          robot.state=ROBOT_STATE.IDLE; robot.orderId=null; robot.shelfId=null;
          robot.path=[]; robot.pathIndex=0; robot.totalDeliveries++; robot.battery=Math.min(100,robot.battery+5);
          events.push({ type:'ROBOT_HOME', robotId:robot.id });
        }
      }
      break;
    }
    case ROBOT_STATE.LIFTING_POD: {
      robot.liftTimer--;
      if (robot.liftTimer <= 0) {
        robot.carryingPod = true;
        const wsAdj = findAdjacentWalkable(grid, {row:WORKSTATION.row,col:WORKSTATION.col});
        const p = findPath(grid, {row:robot.row,col:robot.col}, wsAdj);
        if (p) { robot.path=p; robot.pathIndex=0; robot.state=ROBOT_STATE.CARRYING_TO_WS; }
        events.push({ type:'POD_LIFTED', robotId:robot.id, shelfId:robot.shelfId, orderId:robot.orderId });
      }
      break;
    }
    case ROBOT_STATE.AT_WORKSTATION: {
      robot.wsTimer--;
      if (robot.wsTimer <= 0) {
        const da = findAdjacentWalkable(grid, {row:13,col:17});
        const p = findPath(grid, {row:robot.row,col:robot.col}, da);
        if (p) { robot.path=p; robot.pathIndex=0; robot.state=ROBOT_STATE.CARRYING_TO_DISPATCH; }
        events.push({ type:'VERIFIED_AND_PACKED', robotId:robot.id, orderId:robot.orderId });
      }
      break;
    }
    default: break;
  }
  return events;
}

export function getRobotStatusColor(state) {
  const m = { IDLE:'#22c55e', NAVIGATING_TO_SHELF:'#3b82f6', LIFTING_POD:'#eab308',
    CARRYING_TO_WS:'#a855f7', AT_WORKSTATION:'#f97316', CARRYING_TO_DISPATCH:'#06b6d4', RETURNING_HOME:'#64748b' };
  return m[state] || '#94a3b8';
}

export function getRobotStateLabel(state) {
  const m = { IDLE:'Idle', NAVIGATING_TO_SHELF:'Navigating', LIFTING_POD:'Lifting Pod',
    CARRYING_TO_WS:'Carrying → WS', AT_WORKSTATION:'At Workstation', CARRYING_TO_DISPATCH:'To Dispatch', RETURNING_HOME:'Returning' };
  return m[state] || state;
}
