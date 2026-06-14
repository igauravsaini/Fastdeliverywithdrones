import { PIPELINE_STAGES, getStageProgress, getStageColor } from '../engine/orderPipeline.js';

export default function PipelineBar({ selectedOrder }) {
  const activeStage = selectedOrder?.stage || null;
  const activeIdx = activeStage ? PIPELINE_STAGES.findIndex(s => s.key === activeStage) : -1;

  return (
    <div className="pipeline-bar">
      <div className="pipeline-label">Pipeline</div>
      <div className="pipeline-stages">
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;
          const color = stage.color;
          return (
            <div key={stage.key} className={`pipeline-stage ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
              <div className="pipeline-connector" style={{ background: isPast || isActive ? color : 'rgba(255,255,255,0.08)' }} />
              <div className="pipeline-node" style={{
                background: isActive ? color : isPast ? color : 'rgba(255,255,255,0.06)',
                borderColor: isActive ? color : 'transparent',
                boxShadow: isActive ? `0 0 16px ${color}60` : 'none',
              }}>
                <span className="pipeline-icon">{stage.icon}</span>
              </div>
              <span className="pipeline-stage-label" style={{ color: isActive ? color : isPast ? '#cbd5e1' : '#64748b' }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      {selectedOrder && (
        <div className="pipeline-info">
          <span style={{ color: getStageColor(selectedOrder.stage) }}>
            {selectedOrder.emoji} {selectedOrder.id} — {Math.round(getStageProgress(selectedOrder.stage))}%
          </span>
        </div>
      )}
    </div>
  );
}
