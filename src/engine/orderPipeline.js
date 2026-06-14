// ─── Order Pipeline Manager ──────────────────────────────────────────

export const PIPELINE_STAGES = [
  { key: 'PLACED', label: 'Placed', icon: '📋', color: '#94a3b8' },
  { key: 'ASSIGNED', label: 'Assigned', icon: '🤖', color: '#3b82f6' },
  { key: 'NAVIGATING', label: 'Navigating', icon: '🧭', color: '#8b5cf6' },
  { key: 'POD_LIFTED', label: 'Pod Lifted', icon: '📦', color: '#eab308' },
  { key: 'PACKING', label: 'Packing', icon: '📋', color: '#f97316' },
  { key: 'DISPATCHED', label: 'Dispatched', icon: '🚀', color: '#06b6d4' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: '🛸', color: '#a855f7' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅', color: '#22c55e' },
];

export const STAGE_INDEX = {};
PIPELINE_STAGES.forEach((s, i) => { STAGE_INDEX[s.key] = i; });

const SAMPLE_PRODUCTS = [
  { name: 'Sony WH-1000XM5', emoji: '🎧', zone: 'A', shelf: 'A-01' },
  { name: 'Nintendo Switch OLED', emoji: '🎮', zone: 'A', shelf: 'A-03' },
  { name: 'Canon EOS R6', emoji: '📷', zone: 'A', shelf: 'A-05' },
  { name: 'Dyson V15 Detect', emoji: '🧹', zone: 'B', shelf: 'B-01' },
  { name: 'iPad Pro M4', emoji: '📱', zone: 'B', shelf: 'B-03' },
  { name: 'Bose QC Ultra', emoji: '🔊', zone: 'B', shelf: 'B-05' },
  { name: 'Muji Aroma Diffuser', emoji: '🕯️', zone: 'C', shelf: 'C-01' },
  { name: 'Zojirushi Thermos', emoji: '☕', zone: 'C', shelf: 'C-03' },
  { name: 'Uniqlo HeatTech Set', emoji: '🧥', zone: 'C', shelf: 'C-05' },
  { name: 'Panasonic Nanoe', emoji: '💨', zone: 'A', shelf: 'A-07' },
  { name: 'Sharp Air Purifier', emoji: '🌬️', zone: 'B', shelf: 'B-07' },
  { name: 'Kyocera Knife Set', emoji: '🔪', zone: 'C', shelf: 'C-07' },
];

const YAMATO_SLOTS = ['Same Day', 'Next Morning', 'Next Evening'];

let orderCounter = 1000;

export function createOrder(overrides = {}) {
  const product = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
  orderCounter++;
  return {
    id: overrides.id || `ORD-${orderCounter}`,
    product: overrides.product || product.name,
    emoji: overrides.emoji || product.emoji,
    zone: overrides.zone || product.zone,
    shelf: overrides.shelf || product.shelf,
    stage: 'PLACED',
    robotId: null,
    droneId: null,
    destination: null,
    yamatoSlot: YAMATO_SLOTS[Math.floor(Math.random() * YAMATO_SLOTS.length)],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function advanceOrder(order, newStage) {
  order.stage = newStage;
  order.updatedAt = Date.now();
}

export function getStageProgress(stage) {
  const idx = STAGE_INDEX[stage] ?? 0;
  return ((idx + 1) / PIPELINE_STAGES.length) * 100;
}

export function getStageColor(stage) {
  return PIPELINE_STAGES.find(s => s.key === stage)?.color || '#94a3b8';
}

export function createLogEntry(message, type = 'info') {
  return {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString('ja-JP'),
    message,
    type, // info, success, warning, error
  };
}
