import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Edit2, Check, X, Video, Play, MoreVertical } from 'lucide-react';

export interface YouTubeCardNodeData {
  url: string;
  title: string;
  videoId: string;
  description?: string;
  tags?: string[];
  onUpdate?: (id: string, data: Partial<YouTubeCardNodeData>) => void;
  onDelete?: (id: string) => void;
  onWatchVideo?: (videoId: string) => void;
}

export const YouTubeCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const cardData = data as unknown as YouTubeCardNodeData;
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

  const thumbnailUrl = `https://img.youtube.com/vi/${cardData.videoId}/hqdefault.jpg`;

  return (
    <div className={`knowledge-node youtube-card-node ${selected ? 'selected' : ''}`}>
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
            <label className="input-label">Description</label>
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
          {/* Card Thumbnail Header */}
          <div className="youtube-thumbnail-wrapper nodrag">
            <img src={thumbnailUrl} alt={cardData.title} className="youtube-thumbnail" />
            <div className="youtube-overlay-play" onClick={() => cardData.onWatchVideo?.(cardData.videoId)}>
              <Play className="youtube-play-icon" />
            </div>
            
            <div className="youtube-badge">
              <Video className="youtube-badge-icon" style={{ width: 10, height: 10 }} />
              <span>YouTube</span>
            </div>

            <div className="node-menu-container nodrag youtube-menu-btn" onMouseLeave={() => setShowMenu(false)}>
              <button
                type="button"
                className="btn-icon btn-white-glass"
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

          <div className="node-content" style={{ paddingTop: '10px' }}>
            <h3 className="node-title">{cardData.title || 'YouTube Video'}</h3>
            {cardData.description && (
              <p className="node-text youtube-desc">
                {cardData.description.length > 120 
                  ? `${cardData.description.substring(0, 120)}...` 
                  : cardData.description}
              </p>
            )}
          </div>
          {cardData.tags && cardData.tags.length > 0 && (
            <div className="node-tags-container" style={{ padding: '0 10px 10px 10px' }}>
              {cardData.tags.map((tag) => (
                <span key={tag} className="node-tag" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
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
