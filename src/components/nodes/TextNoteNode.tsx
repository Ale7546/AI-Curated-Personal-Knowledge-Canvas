import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Sparkles, Trash2, Edit2, Check, X, MoreVertical } from 'lucide-react';

import { generateTagsForNode } from '../../services/llmService';
import type { LLMConfig } from '../../services/db';

export interface TextNoteNodeData {
  title: string;
  content: string;
  tags?: string[];
  onUpdate?: (id: string, data: Partial<TextNoteNodeData>) => void;
  onDelete?: (id: string) => void;
  isOllamaOnline?: boolean;
  llmConfig?: LLMConfig;
}

export const TextNoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = data as unknown as TextNoteNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(noteData.title || '');
  const [content, setContent] = useState(noteData.content || '');
  const [tagsInput, setTagsInput] = useState((noteData.tags || []).join(', '));
  const [isTagging, setIsTagging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (noteData.onUpdate) {
      noteData.onUpdate(id, { title, content, tags });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(noteData.title || '');
    setContent(noteData.content || '');
    setTagsInput((noteData.tags || []).join(', '));
    setIsEditing(false);
  };

  const handleAutoTag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noteData.llmConfig) return;
    setIsTagging(true);
    try {
      const generated = await generateTagsForNode(title, content, noteData.llmConfig);
      if (generated && generated.length > 0) {
        setTagsInput(generated.join(', '));
        if (noteData.onUpdate) {
          noteData.onUpdate(id, {
            title,
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
    <div className={`knowledge-node glass-panel text-note-node ${selected ? 'active' : ''}`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} id="t" style={{ background: 'var(--accent-violet)' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: 'var(--accent-violet)' }} />
      <Handle type="target" position={Position.Left} id="l" style={{ background: 'var(--accent-violet)' }} />
      <Handle type="source" position={Position.Right} id="r" style={{ background: 'var(--accent-violet)' }} />

      {isEditing ? (
        <div className="node-edit-form" onKeyDown={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="node-input title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
          />
          <textarea
            className="node-input content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={4}
          />
          <div className="tags-edit-row">
            <input
              type="text"
              className="node-input tags-input-field"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tags (comma separated)"
            />
            {(noteData.llmConfig?.provider !== 'ollama' || noteData.isOllamaOnline) && (
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
            <h3 className="node-title">{noteData.title || 'Untitled Note'}</h3>
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
                  {noteData.onDelete && (
                    <button
                      type="button"
                      className="node-dropdown-item danger-hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        noteData.onDelete?.(id);
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
            {noteData.content ? (
              <p className="node-text">{noteData.content}</p>
            ) : (
              <p className="node-placeholder">Double click or edit to add content...</p>
            )}
          </div>
          {noteData.tags && noteData.tags.length > 0 && (
            <div className="node-tags-container">
              {noteData.tags.map((tag) => (
                <span key={tag} className="node-tag">
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
