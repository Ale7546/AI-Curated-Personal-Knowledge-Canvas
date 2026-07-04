import React, { useState } from 'react';
import { EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react';
import { Check, X, Sparkles } from 'lucide-react';

export interface AIProposedEdgeData {
  reason: string;
  onConnect?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export const AIProposedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });


  const edgeData = data as unknown as AIProposedEdgeData | undefined;
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (edgeData?.onConnect) {
      edgeData.onConnect(id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (edgeData?.onDismiss) {
      edgeData.onDismiss(id);
    }
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path ai-proposed"
        d={edgePath}
        markerEnd={markerEnd}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan proposed-edge-label-container"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {showMenu ? (
            <div className="proposed-edge-menu glass-panel">
              <div className="proposed-edge-reason">
                <Sparkles className="reason-sparkle-icon" />
                <span>{edgeData?.reason || 'AI Suggested Connection'}</span>
              </div>
              <div className="proposed-edge-actions">
                <button className="btn btn-primary btn-xs" onClick={handleConnect} title="Confirm Connection">
                  <Check className="icon-xs" /> Connect
                </button>
                <button className="btn btn-danger btn-xs" onClick={handleDismiss} title="Dismiss Connection">
                  <X className="icon-xs" /> Dismiss
                </button>
              </div>
            </div>
          ) : (
            <button className="proposed-edge-pill" onClick={() => setShowMenu(true)}>
              <Sparkles className="pill-sparkle-icon" />
              <span>AI Link</span>
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
