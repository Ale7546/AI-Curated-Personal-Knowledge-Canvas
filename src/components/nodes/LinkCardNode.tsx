import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Sparkles, Trash2, Edit2, Check, X, ExternalLink, Link2 } from 'lucide-react';

import { generateTagsForNode } from '../../services/ollama';

export interface LinkCardNodeData {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  onUpdate?: (id: string, data: Partial<LinkCardNodeData>) => void;
  onDelete?: (id: string) => void;
  isOllamaOnline?: boolean;
}

export const LinkCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const cardData = data as unknown as LinkCardNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(cardData.url || '');
  const [title, setTitle] = useState(cardData.title || '');
  const [description, setDescription] = useState(cardData.description || '');
  const [tagsInput, setTagsInput] = useState((cardData.tags || []).join(', '));
  const [isTagging, setIsTagging] = useState(false);

  // Extract domain name for neat display
  const getDomain = (urlString: string) => {
    try {
      const parsed = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return parsed.hostname;
    } catch {
      return '';
    }
  };

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (cardData.onUpdate) {
      cardData.onUpdate(id, { url, title, description, tags });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUrl(cardData.url || '');
    setTitle(cardData.title || '');
    setDescription(cardData.description || '');
    setTagsInput((cardData.tags || []).join(', '));
    setIsEditing(false);
  };

  const handleAutoTag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTagging(true);
    try {
      const generated = await generateTagsForNode(title, description);
      if (generated && generated.length > 0) {
        setTagsInput(generated.join(', '));
        if (cardData.onUpdate) {
          cardData.onUpdate(id, {
            url,
            title,
            description,
            tags: generated
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTagging(false);
    }
  };

  const displayUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <div className={`knowledge-node glass-panel link-card-node ${selected ? 'active' : ''}`}>
      <Handle type="target" position={Position.Top} id="t" style={{ background: 'var(--accent-amber)' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: 'var(--accent-amber)' }} />
      <Handle type="target" position={Position.Left} id="l" style={{ background: 'var(--accent-amber)' }} />
      <Handle type="source" position={Position.Right} id="r" style={{ background: 'var(--accent-amber)' }} />

      {isEditing ? (
        <div className="node-edit-form" onKeyDown={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="node-input url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (e.g. google.com)"
          />
          <input
            type="text"
            className="node-input title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link Title"
          />
          <textarea
            className="node-input content-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Link Description..."
            rows={3}
          />
          <div className="tags-edit-row">
            <input
              type="text"
              className="node-input tags-input-field"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tags (comma separated)"
            />
            {cardData.isOllamaOnline && (
              <button
                type="button"
                className="btn btn-secondary btn-icon-only"
                onClick={handleAutoTag}
                disabled={isTagging}
                title="Extract tags using AI"
              >
                <Sparkles className={`icon ${isTagging ? 'spinning' : ''}`} />
              </button>
            )}
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
              <Link2 className="icon-link" />
              {url && <span className="domain-label">{getDomain(url)}</span>}
            </div>
            <div className="node-actions nodrag">
              <button className="btn-icon" onClick={() => setIsEditing(true)} title="Edit Link">
                <Edit2 className="icon-sm" />
              </button>
              {cardData.onDelete && (
                <button className="btn-icon btn-danger-hover" onClick={() => cardData.onDelete?.(id)} title="Delete Link">
                  <Trash2 className="icon-sm" />
                </button>
              )}
            </div>
          </div>
          <div className="node-content">
            <h3 className="node-title link-title">{cardData.title || 'Untitled Link'}</h3>
            {cardData.description && <p className="node-text link-desc">{cardData.description}</p>}
            {url && (
              <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="link-anchor nodrag">
                Open Link <ExternalLink className="icon-xs" />
              </a>
            )}
          </div>
          {cardData.tags && cardData.tags.length > 0 && (
            <div className="node-tags-container">
              {cardData.tags.map((tag) => (
                <span key={tag} className="node-tag link-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
