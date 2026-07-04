import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import type { LLMConfig } from '../services/db';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatPanelProps {
  isChatCollapsed: boolean;
  setIsChatCollapsed: (v: boolean) => void;
  isLlmOnline: boolean;
  llmConfig: LLMConfig | null;
  chatMessages: Message[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  handleSendChatMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isChatCollapsed,
  setIsChatCollapsed,
  isLlmOnline,
  llmConfig,
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  handleSendChatMessage,
  messagesEndRef,
}) => {
  return (
    <div className={`right-sidebar glass-panel ${isChatCollapsed ? 'collapsed' : ''}`}>
      <button
        className="right-sidebar-toggle nodrag"
        onClick={() => setIsChatCollapsed(!isChatCollapsed)}
        title={isChatCollapsed ? 'Open AI Chat' : 'Collapse Panel'}
      >
        {isChatCollapsed ? (
          <ChevronLeft className="icon" />
        ) : (
          <ChevronRight className="icon" />
        )}
      </button>

      <div className="chat-header">
        <h2 className="sidebar-title">
          <MessageSquare className="icon" /> AI Assistant
        </h2>
        <div className="status-bar" style={{ marginTop: '8px' }}>
          <span className={`status-dot ${isLlmOnline ? 'online' : 'offline'}`} />
          <span>Chat: {llmConfig ? (llmConfig.provider === 'ollama' ? 'Local Ollama' : 'Cloud API') : 'Offline'}</span>
        </div>
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
              ? 'AI Brain not configured...'
              : isLlmOnline
              ? 'Ask about your notes...'
              : 'Ollama Offline...'
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
          className="btn btn-primary"
          disabled={!isLlmOnline || isChatLoading || !chatInput.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};
