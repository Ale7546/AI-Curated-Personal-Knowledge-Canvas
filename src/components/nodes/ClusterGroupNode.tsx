import React, { useState } from 'react';
import { type NodeProps } from '@xyflow/react';
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

  return (
    <div
      className={`cluster-group-node cluster-${color} ${selected ? 'active' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 250,
        minHeight: 200,
      }}
    >
      <div className="cluster-header nodrag">
        {isEditing ? (
          <div className="cluster-edit-form" onKeyDown={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="node-input cluster-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cluster Theme"
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
              <button className="btn btn-primary btn-xs" onClick={handleSave} title="Save changes">
                <Check className="icon-xs" />
              </button>
              <button className="btn btn-secondary btn-xs" onClick={handleCancel} title="Cancel">
                <X className="icon-xs" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="cluster-title">{groupData.title || 'Theme Group'}</span>
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
          </>
        )}
      </div>
    </div>
  );
};
