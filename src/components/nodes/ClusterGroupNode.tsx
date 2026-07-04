import React, { useState } from 'react';
import { useNodes, type NodeProps } from '@xyflow/react';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export interface ClusterGroupNodeData {
  title: string;
  clusterColor: string; // emerald, amber, violet, terracotta, ocean
  onUpdate?: (id: string, data: Partial<ClusterGroupNodeData>) => void;
  onDelete?: (id: string) => void;
}

export const ClusterGroupNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const groupData = data as unknown as ClusterGroupNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(groupData.title || '');
  const [color, setColor] = useState(groupData.clusterColor || 'violet');

  // Read all canvas nodes to find children assigned to this parent group
  const allNodes = useNodes();
  const children = allNodes.filter(n => n.parentId === id);

  const handleSave = () => {
    if (groupData.onUpdate) {
      groupData.onUpdate(id, { title, clusterColor: color });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(groupData.title || '');
    setColor(groupData.clusterColor || 'violet');
    setIsEditing(false);
  };

  const colorOptions = ['emerald', 'amber', 'violet', 'terracotta', 'ocean'];

  // 1. Calculate Bounding Circle around child nodes in local space
  let minX = 0;
  let minY = 0;
  let maxX = 250;
  let maxY = 200;

  if (children.length > 0) {
    minX = Math.min(...children.map(c => c.position.x));
    minY = Math.min(...children.map(c => c.position.y));
    maxX = Math.max(...children.map(c => c.position.x + (c.measured?.width || 230)));
    maxY = Math.max(...children.map(c => c.position.y + (c.measured?.height || 160)));
  }

  const padding = 50;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Bounding radius
  const rx = (maxX - minX) / 2 + padding;
  const ry = (maxY - minY) / 2 + padding;
  const radius = Math.max(120, Math.sqrt(rx * rx + ry * ry));

  // 2. Generate smooth, wavy, organic SVG path around coordinates
  const getWavyPath = (cx: number, cy: number, r: number) => {
    const points = [];
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Wavy distortion offset to give an organic bubble look
      const wave = Math.sin(angle * 3) * 12;
      const currentR = r + wave;
      const x = cx + Math.cos(angle) * currentR;
      const y = cy + Math.sin(angle) * currentR;
      points.push({ x, y });
    }

    // Bezier curve connector
    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      const nextNext = points[(i + 2) % points.length];

      const cp1x = curr.x + (next.x - prev.x) * 0.16;
      const cp1y = curr.y + (next.y - prev.y) * 0.16;
      const cp2x = next.x - (nextNext.x - curr.x) * 0.16;
      const cp2y = next.y - (nextNext.y - curr.y) * 0.16;

      pathString += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return pathString;
  };

  const bubblePath = getWavyPath(cx, cy, radius);

  // 3. Compile Wordcloud of top tags within this cluster group
  const allTags = children.flatMap(c => (c.data as any).tags || []);
  const tagCounts: Record<string, number> = {};
  allTags.forEach(tag => {
    const t = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
    if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Derive accent color variable
  const accentColorVar = `var(--accent-${color})`;

  return (
    <div
      className={`cluster-group-node cluster-${color} ${selected ? 'active' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
      }}
    >
      {/* SVG Organic Bubble Path Background */}
      <svg 
        className="cluster-bubble-svg"
        viewBox={`${cx - radius - 60} ${cy - radius - 60} ${(radius + 60) * 2} ${(radius + 60) * 2}`}
      >
        <path 
          d={bubblePath} 
          className="cluster-bubble-path"
          style={{
            fill: `rgba(255, 255, 255, 0.15)`,
            stroke: accentColorVar,
            strokeWidth: selected ? 3 : 2,
          }}
        />
      </svg>

      {/* Floating Header UI */}
      <div 
        className="cluster-header-card glass-panel nodrag"
        style={{
          position: 'absolute',
          left: cx,
          top: cy - radius,
          transform: 'translate(-50%, -100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '12px',
          borderLeft: `3px solid ${accentColorVar}`,
          zIndex: 10,
        }}
      >
        {isEditing ? (
          <div className="cluster-edit-form" onKeyDown={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="node-input cluster-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cluster Name"
            />
            <div className="color-selector">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot dot-${c} ${color === c ? 'selected' : ''}`}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
            <div className="cluster-actions">
              <button className="btn btn-primary btn-xs" onClick={handleSave} title="Save">
                <Check className="icon-xs" />
              </button>
              <button className="btn btn-secondary btn-xs" onClick={handleCancel} title="Cancel">
                <X className="icon-xs" />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span className="cluster-title" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
              {groupData.title || 'Theme Group'}
            </span>
            <div className="cluster-actions">
              <button className="btn-icon-xs" onClick={() => setIsEditing(true)} title="Edit Group">
                <Edit2 className="icon-xs" />
              </button>
              {groupData.onDelete && (
                <button
                  className="btn-icon-xs btn-danger-hover"
                  onClick={() => groupData.onDelete?.(id)}
                  title="Delete Group"
                >
                  <Trash2 className="icon-xs" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Small Cluster Wordcloud widget */}
        {sortedTags.length > 0 && (
          <div className="cluster-wordcloud">
            {sortedTags.map(([tag, count]) => (
              <span 
                key={tag} 
                className="wordcloud-tag" 
                style={{ 
                  fontSize: `${Math.min(0.8, 0.55 + count * 0.05)}rem`,
                  color: accentColorVar,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
