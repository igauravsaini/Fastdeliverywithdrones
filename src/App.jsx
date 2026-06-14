import { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from './components/TopBar.jsx';
import OrderPanel from './components/OrderPanel.jsx';
import WarehouseView from './components/WarehouseView.jsx';
import KPIPanel from './components/KPIPanel.jsx';
import PipelineBar from './components/PipelineBar.jsx';
import SystemLog from './components/SystemLog.jsx';
import DroneMap from './components/DroneMap.jsx';
import { useWebSocket } from './hooks/useWebSocket.js';
import { buildGrid, findShelf } from './engine/warehouse.js';
import { createRobotFleet, findNearestIdleRobot, assignOrderToRobot, tickRobot } from './engine/robotManager.js';
import { createDroneFleet, findAvailableDrone, assignDroneDelivery, tickDrone } from './engine/droneManager.js';
import { createOrder, advanceOrder, createLogEntry } from './engine/orderPipeline.js';
import './App.css';

const TICK_MS = 500;

export default function App() {
  const [grid] = useState(() => buildGrid());
  const [robots, setRobots] = useState(() => createRobotFleet());
  const [drones, setDrones] = useState(() => createDroneFleet());
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([createLogEntry('SwarmRoute Dashboard initialized', 'success')]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [userLocation, setUserLocation] = useState({ lat: 35.6895, lng: 139.6917, name: 'Shibuya, Tokyo' });

  const ordersRef = useRef(orders);
  const robotsRef = useRef(robots);
  const dronesRef = useRef(drones);
  const userLocationRef = useRef(userLocation);

  ordersRef.current = orders;
  robotsRef.current = robots;
  dronesRef.current = drones;
  userLocationRef.current = userLocation;

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-100), createLogEntry(msg, type)]);
  }, []);

  // Geolocation detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({
            lat: latitude,
            lng: longitude,
            name: 'Your Location'
          });
          addLog(`📍 Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
        },
        (error) => {
          addLog('📍 Location access denied or unavailable, using Shibuya, Tokyo fallback', 'info');
        }
      );
    }
  }, [addLog]);

  // Handle incoming order (from WS or manual)
  const handleNewOrder = useCallback((orderData) => {
    const order = createOrder(orderData);
    setOrders(prev => [...prev, order]);
    addLog(`📋 New order ${order.id}: ${order.emoji} ${order.product}`, 'info');

    // Try to assign immediately
    setTimeout(() => {
      const shelf = findShelf(order.shelf);
      if (!shelf) return;
      const robot = findNearestIdleRobot(robotsRef.current, shelf.row, shelf.col);
      if (robot) {
        const ok = assignOrderToRobot(robot, order.id, shelf, grid);
        if (ok) {
          advanceOrder(order, 'ASSIGNED');
          order.robotId = robot.id;
          setOrders(prev => prev.map(o => o.id === order.id ? { ...order } : o));
          setRobots(prev => prev.map(r => r.id === robot.id ? { ...robot } : r));
          addLog(`🤖 ${robot.id} assigned to ${order.id} → shelf ${shelf.id}`, 'success');
          advanceOrder(order, 'NAVIGATING');
          setOrders(prev => prev.map(o => o.id === order.id ? { ...order } : o));
        }
      }
    }, 200);
  }, [grid, addLog]);

  // WebSocket integration
  const { connected } = useWebSocket('ws://localhost:4000', handleNewOrder);

  // Manual new order
  const handleManualOrder = useCallback(() => {
    handleNewOrder({});
  }, [handleNewOrder]);

  // Main simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(Date.now());
      
      // Copy current states from refs to prevent updater race conditions
      const currentRobots = robotsRef.current.map(r => ({ ...r, path: [...r.path] }));
      const currentDrones = dronesRef.current.map(d => ({ ...d, flightPath: [...d.flightPath] }));
      let currentOrders = ordersRef.current.map(o => ({ ...o }));
      
      const newEvents = [];
      
      // 1. Tick robots
      const updatedRobots = currentRobots.map(r => {
        const events = tickRobot(r, grid);
        newEvents.push(...events);
        return r;
      });
      
      // 2. Tick drones
      const updatedDrones = currentDrones.map(d => {
        const events = tickDrone(d);
        newEvents.push(...events);
        return d;
      });
      
      // 3. Process events
      for (const evt of newEvents) {
        switch (evt.type) {
          case 'ROBOT_AT_SHELF':
            addLog(`📍 ${evt.robotId} reached shelf ${evt.shelfId}`, 'info');
            break;
          case 'POD_LIFTED':
            currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, stage: 'POD_LIFTED' } : o);
            addLog(`📦 ${evt.robotId} lifted pod ${evt.shelfId} for ${evt.orderId}`, 'success');
            break;
          case 'ROBOT_AT_WORKSTATION':
            currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, stage: 'PACKING' } : o);
            addLog(`👷 ${evt.robotId} at workstation — verifying ${evt.orderId}`, 'info');
            break;
          case 'VERIFIED_AND_PACKED': {
            currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, stage: 'DISPATCHED' } : o);
            addLog(`✅ ${evt.orderId} verified & packed → dispatch`, 'success');
            
            // Assign drone
            const drone = updatedDrones.find(d => d.state === 'DOCKED');
            if (drone) {
              const dest = assignDroneDelivery(drone, evt.orderId, userLocationRef.current);
              currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, droneId: drone.id, destination: dest.name } : o);
              addLog(`🛸 ${drone.id} assigned to deliver ${evt.orderId} → ${dest.name}`, 'info');
            }
            break;
          }
          case 'POD_AT_DISPATCH':
            addLog(`🚀 Pod delivered to dispatch pad by ${evt.robotId}`, 'info');
            break;
          case 'ROBOT_HOME':
            addLog(`🏠 ${evt.robotId} returned home`, 'info');
            break;
          case 'DRONE_LAUNCHED':
            currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, stage: 'IN_TRANSIT' } : o);
            addLog(`🚀 ${evt.droneId} launched with ${evt.orderId}`, 'success');
            break;
          case 'DRONE_RELAY':
            addLog(`📡 ${evt.droneId} relay at ${evt.relay}`, 'info');
            break;
          case 'DRONE_ARRIVED':
            addLog(`📍 ${evt.droneId} arrived at ${evt.destination}`, 'success');
            break;
          case 'DRONE_DELIVERED':
            currentOrders = currentOrders.map(o => o.id === evt.orderId ? { ...o, stage: 'DELIVERED' } : o);
            addLog(`✅ ${evt.orderId} delivered to ${evt.destination}!`, 'success');
            break;
          case 'DRONE_RETURNED':
            addLog(`🏠 ${evt.droneId} returned to dock`, 'info');
            break;
          default: break;
        }
      }
      
      // 4. Auto-assign unassigned orders
      currentOrders = currentOrders.map(order => {
        if (order.stage !== 'PLACED') return order;
        const shelf = findShelf(order.shelf);
        if (!shelf) return order;
        
        // Find nearest idle robot using the updated list
        let bestRobot = null;
        let bestDist = Infinity;
        for (const r of updatedRobots) {
          if (r.state !== 'IDLE') continue;
          const d = Math.abs(r.row - shelf.row) + Math.abs(r.col - shelf.col);
          if (d < bestDist) {
            bestDist = d;
            bestRobot = r;
          }
        }
        
        if (bestRobot) {
          const ok = assignOrderToRobot(bestRobot, order.id, shelf, grid);
          if (ok) {
            addLog(`🤖 ${bestRobot.id} assigned to ${order.id}`, 'success');
            return { ...order, stage: 'NAVIGATING', robotId: bestRobot.id };
          }
        }
        return order;
      });
      
      // 5. Commit all states together
      setRobots(updatedRobots);
      setDrones(updatedDrones);
      setOrders(currentOrders);
      
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [grid, addLog]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  return (
    <div className="app">
      <TopBar connected={connected} onNewOrder={handleManualOrder} orderCount={orders.length} />
      <div className="main-layout">
        <div className="left-panel">
          <OrderPanel orders={orders} selectedOrderId={selectedOrderId} onSelectOrder={setSelectedOrderId} />
          <SystemLog logs={logs} />
        </div>
        <div className="center-panel">
          <WarehouseView grid={grid} robots={robots} drones={drones} selectedOrderId={selectedOrderId} orders={orders} />
          <PipelineBar selectedOrder={selectedOrder} />
        </div>
        <div className="right-panel">
          <KPIPanel orders={orders} robots={robots} drones={drones} />
          <DroneMap drones={drones} userLocation={userLocation} setUserLocation={setUserLocation} />
        </div>
      </div>
    </div>
  );
}
