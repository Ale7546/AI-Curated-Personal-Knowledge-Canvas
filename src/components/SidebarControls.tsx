import React, { useState, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Database,
  FileText,
  Link2,
  Image as ImageIcon,
  FolderPlus,
  Trash2,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Upload,
} from 'lucide-react';
import type { LocalUser } from '../services/db';

interface SidebarControlsProps {
  activeUser: LocalUser;
  isBrainReady: boolean;
  isAnalyzing: boolean;
  getBrainStatusText: () => string;
  addNode: (type: 'textNote' | 'linkCard' | 'imageCard' | 'clusterGroup') => void;
  handleAnalyzeCanvas: () => void;
  loadDemoData: () => void;
  clearCanvas: () => void;
  leftSidebarCollapsed: boolean;
  setLeftSidebarCollapsed: (v: boolean) => void;
  setShowLLMSelector: (v: boolean) => void;
  onLogout: () => void;
  onUploadDocument: (file: File) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  activeUser,
  isBrainReady,
  isAnalyzing,
  getBrainStatusText,
  addNode,
  handleAnalyzeCanvas,
  loadDemoData,
  clearCanvas,
  leftSidebarCollapsed,
  setLeftSidebarCollapsed,
  setShowLLMSelector,
  onLogout,
  onUploadDocument,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return '??';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  };

  const getAvatarGradient = (username: string) => {
    const gradients = [
      'linear-gradient(135deg, #fed7aa 0%, #fbcfe8 100%)', // Peach / Pink
      'linear-gradient(135deg, #bfdbfe 0%, #fbcfe8 100%)', // Blue / Pink
      'linear-gradient(135deg, #bbf7d0 0%, #a5f3fc 100%)', // Mint / Sky
      'linear-gradient(135deg, #fef08a 0%, #fed7aa 100%)', // Yellow / Peach
      'linear-gradient(135deg, #e9d5ff 0%, #fbcfe8 100%)', // Purple / Pink
    ];
    if (!username) return gradients[0];
    const index = username.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`left-sidebar glass-panel nodrag ${leftSidebarCollapsed ? 'collapsed' : ''}`}>
      <button
        className="left-sidebar-toggle nodrag"
        onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        title={leftSidebarCollapsed ? 'Open Canvas Hub' : 'Collapse Panel'}
      >
        {leftSidebarCollapsed ? <ChevronRight className="icon" /> : <ChevronLeft className="icon" />}
      </button>

      <h2 className="sidebar-title">
        <Database className="icon" /> Canvas Hub
      </h2>

      <div className="status-bar">
        <span className={`status-dot ${isBrainReady ? 'online' : 'offline'}`} />
        <span>AI Status: {getBrainStatusText()}</span>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">Add Element</span>
        <button className="btn btn-secondary" onClick={() => addNode('textNote')}>
          <FileText className="icon-sm" /> Text Note
        </button>
        <button className="btn btn-secondary" onClick={() => addNode('linkCard')}>
          <Link2 className="icon-sm" /> Web Link
        </button>
        <button className="btn btn-secondary" onClick={() => addNode('imageCard')}>
          <ImageIcon className="icon-sm" /> Image Card
        </button>
        <button className="btn btn-secondary" onClick={() => addNode('clusterGroup')}>
          <FolderPlus className="icon-sm" /> Group Frame
        </button>
        
        {/* Document upload triggers */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".txt,.md,.pdf" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUploadDocument(file);
              // Clear input value so selecting the same file again triggers change
              e.target.value = '';
            }
          }}
        />
        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="icon-sm" /> Upload Doc
        </button>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">AI Actions</span>
        <button
          className="btn btn-primary"
          onClick={handleAnalyzeCanvas}
          disabled={!isBrainReady || isAnalyzing}
        >
          <Sparkles className={`icon-sm ${isAnalyzing ? 'spinning' : ''}`} />
          {isAnalyzing ? 'Scanning with AI...' : 'Analyze Canvas'}
        </button>
      </div>

      <div className="sidebar-section">
        <button className="btn btn-secondary btn-sm" onClick={loadDemoData}>
          <RefreshCw className="icon-sm" /> Load Demo
        </button>
        <button className="btn btn-danger btn-sm" onClick={clearCanvas}>
          <Trash2 className="icon-sm" /> Clear Canvas
        </button>
      </div>

      {/* User Profile Widget at the bottom */}
      <div 
        className="user-profile-widget"
        onMouseLeave={() => setShowPopover(false)}
      >
        {showPopover && (
          <div className="profile-popover glass-panel">
            <button 
              type="button" 
              className="popover-btn" 
              onClick={() => {
                setShowPopover(false);
                setShowLLMSelector(true);
              }}
            >
              <Settings className="icon-xs" style={{ width: 14, height: 14 }} /> AI Config
            </button>
            <button 
              type="button" 
              className="popover-btn danger-hover" 
              onClick={() => {
                setShowPopover(false);
                onLogout();
              }}
            >
              <LogOut className="icon-xs" style={{ width: 14, height: 14 }} /> Log Out
            </button>
          </div>
        )}

        <div 
          className="profile-avatar" 
          style={{ background: getAvatarGradient(activeUser.username) }}
        >
          {getInitials(activeUser.username)}
        </div>
        <div className="profile-details">
          <span className="profile-username">{activeUser.username}</span>
          <span className="profile-brain">{getBrainStatusText()}</span>
        </div>
        <button 
          className="profile-settings-btn"
          onClick={() => setShowPopover(!showPopover)}
          title="Profile settings"
        >
          <User className="icon-sm" />
        </button>
      </div>
    </div>
  );
};
