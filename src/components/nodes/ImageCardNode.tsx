import React, { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Sparkles, Trash2, Edit2, Check, X, Upload, Image as ImageIcon } from 'lucide-react';

import { generateTagsForNode } from '../../services/ollama';

export interface ImageCardNodeData {
  title: string;
  imageUrl?: string; // Base64 string or URL
  content?: string;  // Caption/Description
  tags?: string[];
  onUpdate?: (id: string, data: Partial<ImageCardNodeData>) => void;
  onDelete?: (id: string) => void;
  isOllamaOnline?: boolean;
}

export const ImageCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const cardData = data as unknown as ImageCardNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(cardData.title || '');
  const [imageUrl, setImageUrl] = useState(cardData.imageUrl || '');
  const [content, setContent] = useState(cardData.content || '');
  const [tagsInput, setTagsInput] = useState((cardData.tags || []).join(', '));
  const [isTagging, setIsTagging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (cardData.onUpdate) {
      cardData.onUpdate(id, { title, imageUrl, content, tags });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(cardData.title || '');
    setImageUrl(cardData.imageUrl || '');
    setContent(cardData.content || '');
    setTagsInput((cardData.tags || []).join(', '));
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoTag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTagging(true);
    try {
      const generated = await generateTagsForNode(title, content || 'Image Note');
      if (generated && generated.length > 0) {
        setTagsInput(generated.join(', '));
        if (cardData.onUpdate) {
          cardData.onUpdate(id, {
            title,
            imageUrl,
            content,
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

  return (
    <div className={`knowledge-node glass-panel image-card-node ${selected ? 'active' : ''}`}>
      <Handle type="target" position={Position.Top} id="t" style={{ background: 'var(--accent-terracotta)' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: 'var(--accent-terracotta)' }} />
      <Handle type="target" position={Position.Left} id="l" style={{ background: 'var(--accent-terracotta)' }} />
      <Handle type="source" position={Position.Right} id="r" style={{ background: 'var(--accent-terracotta)' }} />

      {isEditing ? (
        <div className="node-edit-form" onKeyDown={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="node-input title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Image Title"
          />
          <div className="image-upload-row">
            <input
              type="text"
              className="node-input image-url-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL or upload file"
            />
            <button
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Local Image"
            >
              <Upload className="icon" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <textarea
            className="node-input content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Image Caption / Notes..."
            rows={2}
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
            <div className="image-header-container">
              <ImageIcon className="icon-image" />
              <span className="image-label">Image Node</span>
            </div>
            <div className="node-actions nodrag">
              <button className="btn-icon" onClick={() => setIsEditing(true)} title="Edit Image">
                <Edit2 className="icon-sm" />
              </button>
              {cardData.onDelete && (
                <button className="btn-icon btn-danger-hover" onClick={() => cardData.onDelete?.(id)} title="Delete Image">
                  <Trash2 className="icon-sm" />
                </button>
              )}
            </div>
          </div>
          <div className="node-content image-node-content">
            {cardData.imageUrl ? (
              <div className="node-image-wrapper nodrag">
                <img src={cardData.imageUrl} alt={cardData.title || 'Canvas uploaded image'} className="node-img" />
              </div>
            ) : (
              <div className="image-placeholder-block">
                <ImageIcon className="placeholder-icon" />
                <p>No image uploaded</p>
              </div>
            )}
            <h3 className="node-title image-title">{cardData.title || 'Untitled Image'}</h3>
            {cardData.content && <p className="node-text image-caption">{cardData.content}</p>}
          </div>
          {cardData.tags && cardData.tags.length > 0 && (
            <div className="node-tags-container">
              {cardData.tags.map((tag) => (
                <span key={tag} className="node-tag image-tag">
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
