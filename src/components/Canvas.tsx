import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import { X } from 'lucide-react';

import { TextNoteNode } from './nodes/TextNoteNode';
import { LinkCardNode } from './nodes/LinkCardNode';
import { ImageCardNode } from './nodes/ImageCardNode';
import { ClusterGroupNode } from './nodes/ClusterGroupNode';
import { DocumentCardNode } from './nodes/DocumentCardNode';
import { YouTubeCardNode } from './nodes/YouTubeCardNode';
import { AIProposedEdge } from './edges/AIProposedEdge';

const nodeTypes = {
  textNote: TextNoteNode,
  linkCard: LinkCardNode,
  imageCard: ImageCardNode,
  clusterGroup: ClusterGroupNode,
  documentCard: DocumentCardNode,
  youtubeCard: YouTubeCardNode,
};

const edgeTypes = {
  aiProposed: AIProposedEdge,
};

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDragStop: (e: any, node: any) => void;
  isAnalyzing: boolean;
  searchQuery: string;
  originalPositions: Record<string, { x: number; y: number }> | null;
  setOriginalPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }> | null>>;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  isAnalyzing,
  searchQuery,
  originalPositions,
  setOriginalPositions,
  setNodes,
}) => {
  const [watchVideoId, setWatchVideoId] = useState<string | null>(null);

  // Intercept YouTube node callbacks to set the watch modal ID
  const augmentedNodes = nodes.map((node) => {
    if (node.type === 'youtubeCard') {
      return {
        ...node,
        data: {
          ...node.data,
          onWatchVideo: (videoId: string) => setWatchVideoId(videoId),
        },
      };
    }
    return node;
  });

  // Temporarily regroup nodes in a grid during keyword search queries
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      // 1. Capture current positions if starting a fresh search
      let currentOriginals = originalPositions;
      if (!currentOriginals) {
        currentOriginals = nodes.reduce((acc, n) => {
          acc[n.id] = { x: n.position.x, y: n.position.y };
          return acc;
        }, {} as Record<string, { x: number; y: number }>);
        setOriginalPositions(currentOriginals);
      }

      // 2. Select matching non-group notes
      const matchingNodes = nodes.filter((n) => {
        if (n.type === 'clusterGroup') return false;
        const data = n.data as any;
        const title = (data.title || '').toLowerCase();
        const content = (data.content || '').toLowerCase();
        const desc = (data.description || '').toLowerCase();
        const tags = (data.tags || []).join(' ').toLowerCase();
        return (
          title.includes(query) ||
          content.includes(query) ||
          desc.includes(query) ||
          tags.includes(query)
        );
      });

      // 3. Spatially position matching items side-by-side in center grid
      const center = { x: 150, y: 150 };
      const gap = 260;
      const columns = Math.ceil(Math.sqrt(matchingNodes.length)) || 1;

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.type === 'clusterGroup') {
            return {
              ...n,
              style: { ...n.style, opacity: 0.05 },
              draggable: false,
            };
          }

          const matchIndex = matchingNodes.findIndex((m) => m.id === n.id);
          if (matchIndex >= 0) {
            const row = Math.floor(matchIndex / columns);
            const col = matchIndex % columns;
            const targetX = center.x + col * gap - ((columns - 1) * gap) / 2;
            const targetY = center.y + row * gap - ((columns - 1) * gap) / 2;

            return {
              ...n,
              position: { x: targetX, y: targetY },
              draggable: false,
              style: { ...n.style, opacity: 1 },
            };
          } else {
            return {
              ...n,
              draggable: false,
              style: { ...n.style, opacity: 0.15 },
            };
          }
        })
      );
    } else {
      // 4. Restore starting locations once search clears
      if (originalPositions) {
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            const orig = originalPositions[n.id];
            return {
              ...n,
              position: orig || n.position,
              draggable: true,
              style: { ...n.style, opacity: 1 },
            };
          })
        );
        setOriginalPositions(null);
      }
    }
  }, [searchQuery]);

  return (
    <div className={`canvas-container ${isAnalyzing ? 'canvas-scanning-pulse' : ''}`}>
      <ReactFlow
        nodes={augmentedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls position="bottom-left" />
        <Background variant={BackgroundVariant.Dots} color="var(--bg-grid)" gap={16} size={1} />
      </ReactFlow>

      {/* Floating search bounding grid indicator */}
      {searchQuery.trim() && (
        <div className="search-regroup-banner glass-panel">
          <span>Viewing search matches for: <strong>"{searchQuery}"</strong></span>
        </div>
      )}

      {/* Embedded YouTube watch modal overlay */}
      {watchVideoId && (
        <div className="youtube-modal-overlay nodrag" onClick={() => setWatchVideoId(null)}>
          <div className="youtube-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="youtube-close-btn" 
              onClick={() => setWatchVideoId(null)}
              title="Close Player"
            >
              <X className="icon-sm" />
            </button>
            <div className="youtube-video-aspect">
              <iframe
                title="YouTube Video Player"
                src={`https://www.youtube.com/embed/${watchVideoId}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="youtube-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
