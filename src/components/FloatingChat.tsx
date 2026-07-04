import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Maximize2,
  Minimize2,
  X,
  Send,
  Move,
} from 'lucide-react';
import type { LLMConfig, Message } from '../services/db';

interface FloatingChatProps {
  isLlmOnline: boolean;
  llmConfig: LLMConfig | null;
  chatMessages: Message[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  handleSendChatMessage: (e: React.FormEvent) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({
  isLlmOnline,
  llmConfig,
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  handleSendChatMessage,
  searchQuery,
  setSearchQuery,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 340, height: 440 });
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat logs to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, isOpen]);

  // Handle dragging the top-left corner to resize the chat box
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      setDimensions({
        width: Math.max(280, Math.min(600, startWidth - deltaX)),
        height: Math.max(300, Math.min(700, startHeight - deltaY)),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // If collapsed: render floating launcher bubble
  if (!isOpen) {
    return (
      <div 
        className="chat-launcher-bubble nodrag"
        onClick={() => setIsOpen(true)}
        title="Open Canvas Companion"
      >
        <MessageSquare className="chat-launcher-icon" />
        <span className="chat-launcher-glow" />
      </div>
    );
  }

  // If docked: render full height right sidebar
  if (isDocked) {
    return (
      <div className="right-sidebar glass-panel nodrag">
        <div className="chat-header">
          <div className="chat-header-title">
            <MessageSquare className="icon-sm" />
            <span className="sidebar-title-text">Canvas Companion</span>
          </div>
          <div className="chat-header-actions">
            <button className="btn-icon-xs" onClick={() => setIsDocked(false)} title="Float Window">
              <Minimize2 className="icon-xs" style={{ width: 14, height: 14 }} />
            </button>
            <button className="btn-icon-xs" onClick={() => setIsOpen(false)} title="Close Chat">
              <X className="icon-xs" style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="chat-search-row">
          <Search className="search-icon-sm" />
          <input
            type="text"
            className="node-input search-input-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search & Regroup Canvas..."
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X className="icon-xs" style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isChatLoading && (
            <div className="chat-message assistant">
              <div className="chat-message-loader">
                <div className="chat-dot" />
                <div className="chat-dot" />
                <div className="chat-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendChatMessage}>
          <textarea
            className="chat-textarea"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              !llmConfig
                ? 'Configure AI Settings first...'
                : isLlmOnline
                ? 'Ask me about your canvas...'
                : 'Local Ollama is offline...'
            }
            disabled={!isLlmOnline || isChatLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage(e);
              }
            }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-icon-only"
            disabled={!isLlmOnline || isChatLoading || !chatInput.trim()}
          >
            <Send className="icon-sm" />
          </button>
        </form>
      </div>
    );
  }

  // Floating state: render resizable overlay box
  return (
    <div
      className="floating-chat-container glass-panel nodrag"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {/* Resize Handle on Top-Left Corner */}
      <div 
        className="chat-resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      >
        <Move className="resize-icon" />
      </div>

      <div className="chat-header">
        <div className="chat-header-title">
          <MessageSquare className="icon-sm" />
          <span className="sidebar-title-text">Companion</span>
        </div>
        <div className="chat-header-actions">
          <button 
            className={`btn-icon-xs ${showSearch ? 'active' : ''}`} 
            onClick={() => setShowSearch(!showSearch)} 
            title="Search & Regroup"
          >
            <Search className="icon-xs" style={{ width: 14, height: 14 }} />
          </button>
          <button className="btn-icon-xs" onClick={() => setIsDocked(true)} title="Dock to Sidebar">
            <Maximize2 className="icon-xs" style={{ width: 14, height: 14 }} />
          </button>
          <button className="btn-icon-xs" onClick={() => setIsOpen(false)} title="Close Chat">
            <X className="icon-xs" style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Conditionally visible search input bar */}
      {showSearch && (
        <div className="chat-search-row animate-slide-down">
          <Search className="search-icon-sm" />
          <input
            type="text"
            className="node-input search-input-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search & Regroup Canvas..."
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X className="icon-xs" style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      )}

      <div className="chat-messages">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isChatLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-loader">
              <div className="chat-dot" />
              <div className="chat-dot" />
              <div className="chat-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSendChatMessage}>
        <textarea
          className="chat-textarea"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={
            !llmConfig
              ? 'Configure AI Settings first...'
              : isLlmOnline
              ? 'Ask me about your canvas...'
              : 'Local Ollama is offline...'
          }
          disabled={!isLlmOnline || isChatLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendChatMessage(e);
            }
          }}
        />
        <button
          type="submit"
          className="btn btn-primary btn-icon-only"
          disabled={!isLlmOnline || isChatLoading || !chatInput.trim()}
        >
          <Send className="icon-sm" />
        </button>
      </form>
    </div>
  );
};
