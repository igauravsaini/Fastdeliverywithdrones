// ─── Drone Delivery Manager ──────────────────────────────────────────
// Manages drone fleet with relay chain delivery simulation

export const DRONE_STATE = {
  DOCKED: 'DOCKED',
  LOADING: 'LOADING',
  IN_FLIGHT: 'IN_FLIGHT',
  DELIVERING: 'DELIVERING',
  RETURNING: 'RETURNING',
};

// Mocked relay chain: warehouse cities → delivery destinations
export const RELAY_CHAIN = [
  { name: 'Tokyo HQ', lat: 35.6762, lng: 139.6503, emoji: '🏢' },
  { name: 'Nagoya Hub', lat: 35.1815, lng: 136.9066, emoji: '🏭' },
  { name: 'Osaka Relay', lat: 34.6937, lng: 135.5023, emoji: '📡' },
  { name: 'Kyoto Depot', lat: 35.0116, lng: 135.7681, emoji: '🏪' },
];

export const DELIVERY_DESTINATIONS = [
  { name: 'Shibuya, Tokyo', lat: 35.6580, lng: 139.7016 },
  { name: 'Shinjuku, Tokyo', lat: 35.6938, lng: 139.7034 },
  { name: 'Namba, Osaka', lat: 34.6654, lng: 135.5013 },
  { name: 'Gion, Kyoto', lat: 35.0037, lng: 135.7786 },
  { name: 'Sakae, Nagoya', lat: 35.1709, lng: 136.9085 },
  { name: 'Umeda, Osaka', lat: 34.7055, lng: 135.4983 },
];

// Haversine distance in km
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function createDroneFleet() {
  return [
    { id:'Drone-α', state:DRONE_STATE.DOCKED, orderId:null, progress:0, flightPath:[], currentLeg:0, destination:null, loadTimer:0, deliverTimer:0, totalFlights:Math.floor(Math.random()*10), battery:95+Math.floor(Math.random()*6) },
    { id:'Drone-β', state:DRONE_STATE.DOCKED, orderId:null, progress:0, flightPath:[], currentLeg:0, destination:null, loadTimer:0, deliverTimer:0, totalFlights:Math.floor(Math.random()*10), battery:90+Math.floor(Math.random()*11) },
    { id:'Drone-γ', state:DRONE_STATE.DOCKED, orderId:null, progress:0, flightPath:[], currentLeg:0, destination:null, loadTimer:0, deliverTimer:0, totalFlights:Math.floor(Math.random()*10), battery:88+Math.floor(Math.random()*13) },
  ];
}

export function findAvailableDrone(drones) {
  return drones.find(d => d.state === DRONE_STATE.DOCKED) || null;
}

export function assignDroneDelivery(drone, orderId, userLoc) {
  const baseLat = userLoc?.lat ?? 35.6895;
  const baseLng = userLoc?.lng ?? 139.6917;
  const baseName = userLoc?.name ?? 'Shibuya, Tokyo';

  // Build warehouse and micro-relay nearby the destination location (approx 1.5 - 2 km away)
  const warehouse = { name: 'SwarmRoute Warehouse', lat: baseLat + 0.012, lng: baseLng - 0.015, emoji: '🏭' };
  const relayNode = { name: 'Local Micro-Relay Hub', lat: baseLat + 0.006, lng: baseLng - 0.007, emoji: '📡' };
  const destNode = { name: baseName, lat: baseLat, lng: baseLng, emoji: '📍' };

  const path = [warehouse, relayNode, destNode];
  drone.state = DRONE_STATE.LOADING;
  drone.orderId = orderId;
  drone.flightPath = path;
  drone.currentLeg = 0;
  drone.progress = 0;
  drone.destination = destNode;
  drone.loadTimer = 3;
  return destNode;
}

export function tickDrone(drone) {
  const events = [];
  switch (drone.state) {
    case DRONE_STATE.LOADING:
      drone.loadTimer--;
      if (drone.loadTimer <= 0) {
        drone.state = DRONE_STATE.IN_FLIGHT;
        events.push({ type:'DRONE_LAUNCHED', droneId:drone.id, orderId:drone.orderId });
      }
      break;
    case DRONE_STATE.IN_FLIGHT:
      drone.progress += 0.08;
      if (drone.progress >= 1) {
        drone.currentLeg++;
        drone.progress = 0;
        if (drone.currentLeg >= drone.flightPath.length - 1) {
          drone.state = DRONE_STATE.DELIVERING;
          drone.deliverTimer = 4;
          events.push({ type:'DRONE_ARRIVED', droneId:drone.id, orderId:drone.orderId, destination:drone.destination?.name });
        } else {
          const relay = drone.flightPath[drone.currentLeg];
          events.push({ type:'DRONE_RELAY', droneId:drone.id, relay:relay.name });
        }
      }
      drone.battery = Math.max(0, drone.battery - 0.2);
      break;
    case DRONE_STATE.DELIVERING:
      drone.deliverTimer--;
      if (drone.deliverTimer <= 0) {
        drone.state = DRONE_STATE.RETURNING;
        drone.progress = 0;
        events.push({ type:'DRONE_DELIVERED', droneId:drone.id, orderId:drone.orderId, destination:drone.destination?.name });
      }
      break;
    case DRONE_STATE.RETURNING:
      drone.progress += 0.12;
      if (drone.progress >= 1) {
        drone.state = DRONE_STATE.DOCKED;
        drone.orderId = null;
        drone.flightPath = [];
        drone.currentLeg = 0;
        drone.progress = 0;
        drone.destination = null;
        drone.totalFlights++;
        drone.battery = Math.min(100, drone.battery + 15);
        events.push({ type:'DRONE_RETURNED', droneId:drone.id });
      }
      break;
    default: break;
  }
  return events;
}

export function getDroneStatusColor(state) {
  const m = { DOCKED:'#22c55e', LOADING:'#eab308', IN_FLIGHT:'#3b82f6', DELIVERING:'#f97316', RETURNING:'#64748b' };
  return m[state] || '#94a3b8';
}
