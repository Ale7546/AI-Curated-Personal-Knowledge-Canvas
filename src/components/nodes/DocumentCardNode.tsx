import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Edit2, Check, X, FileText, MoreVertical } from 'lucide-react';

export interface DocumentCardNodeData {
  title: string;
  content: string; // The extracted document text
  description?: string;
  tags?: string[];
  onUpdate?: (id: string, data: Partial<DocumentCardNodeData>) => void;
  onDelete?: (id: string) => void;
}

export const DocumentCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const cardData = data as unknown as DocumentCardNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(cardData.title || '');
  const [description, setDescription] = useState(cardData.description || '');
  const [tagsInput, setTagsInput] = useState((cardData.tags || []).join(', '));
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (cardData.onUpdate) {
      cardData.onUpdate(id, { title, description, tags });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(cardData.title || '');
    setDescription(cardData.description || '');
    setTagsInput((cardData.tags || []).join(', '));
    setIsEditing(false);
  };

  return (
    <div className={`knowledge-node document-card-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="handle-point" />
      
      {isEditing ? (
        <div className="node-edit-view nodrag" onKeyDown={(e) => e.stopPropagation()}>
          <div className="input-group">
            <label className="input-label">Title</label>
            <input
              type="text"
              className="node-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Summary</label>
            <textarea
              className="node-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tags (comma-separated)</label>
            <input
              type="text"
              className="node-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <div className="node-actions-row">
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              <Check className="icon-sm" /> Save
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
              <X className="icon-sm" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="node-display-view">
          <div className="node-header">
            <div className="link-icon-container">
              <FileText className="icon-link" style={{ color: 'var(--accent-ocean)' }} />
              <span className="domain-label">Document</span>
            </div>
            <div className="node-menu-container nodrag" onMouseLeave={() => setShowMenu(false)}>
              <button
                type="button"
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                title="Actions"
              >
                <MoreVertical className="icon-sm" />
              </button>
              {showMenu && (
                <div className="node-dropdown-menu">
                  <button
                    type="button"
                    className="node-dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                  >
                    <Edit2 className="icon-xs" style={{ width: 12, height: 12 }} /> Edit
                  </button>
                  {cardData.onDelete && (
                    <button
                      type="button"
                      className="node-dropdown-item danger-hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        cardData.onDelete?.(id);
                        setShowMenu(false);
                      }}
                    >
                      <Trash2 className="icon-xs" style={{ width: 12, height: 12 }} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="node-content">
            <h3 className="node-title">{cardData.title || 'Untitled Document'}</h3>
            {cardData.description && <p className="node-text">{cardData.description}</p>}
            
            {/* Scrollable Document Text Preview */}
            <div className="document-preview-box nodrag">
              {cardData.content ? (
                cardData.content.length > 250 
                  ? `${cardData.content.substring(0, 250)}...` 
                  : cardData.content
              ) : (
                <span className="node-placeholder">Empty Document</span>
              )}
            </div>
          </div>
          {cardData.tags && cardData.tags.length > 0 && (
            <div className="node-tags-container">
              {cardData.tags.map((tag) => (
                <span key={tag} className="node-tag" style={{ background: 'rgba(14, 165, 233, 0.12)', color: 'var(--accent-ocean)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="handle-point" />
    </div>
  );
};
