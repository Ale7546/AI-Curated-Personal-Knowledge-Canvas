import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Sparkles,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Database,
  Image as ImageIcon,
  Link2,
  FileText,
  Trash2,
  FolderPlus,
} from 'lucide-react';

import { db } from './services/db';
import type { LocalNode, LocalEdge } from './services/db';
import { checkOllamaStatus, analyzeCanvasConnections, askMistral } from './services/ollama';


import { TextNoteNode } from './components/nodes/TextNoteNode';
import { LinkCardNode } from './components/nodes/LinkCardNode';
import { ImageCardNode } from './components/nodes/ImageCardNode';
import { ClusterGroupNode } from './components/nodes/ClusterGroupNode';
import { AIProposedEdge } from './components/edges/AIProposedEdge';

const nodeTypes = {
  textNote: TextNoteNode,
  linkCard: LinkCardNode,
  imageCard: ImageCardNode,
  clusterGroup: ClusterGroupNode,
};

const edgeTypes = {
  aiProposed: AIProposedEdge,
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Inner Canvas Component that has access to useReactFlow
const CanvasWorkspace: React.FC<{
  isOllamaOnline: boolean;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}> = ({ isOllamaOnline, isAnalyzing, setIsAnalyzing, refreshTrigger, setRefreshTrigger }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { screenToFlowPosition } = useReactFlow();

  // Update a node's data in both state and DB
  const handleNodeUpdate = useCallback(
    async (nodeId: string, updatedData: any) => {
      const node = await db.nodes.get(nodeId);
      if (node) {
        const newData = { ...node.data, ...updatedData };
        await db.nodes.update(nodeId, { data: newData });
        setNodes((nds) =>
          nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updatedData } } : n))
        );
      }
    },
    [setNodes]
  );

  // Delete a node, delete its edges, and unparent its children
  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      await db.nodes.delete(nodeId);
      // Remove child references
      const children = await db.nodes.where('parentId').equals(nodeId).toArray();
      for (const child of children) {
        await db.nodes.update(child.id, { parentId: undefined });
      }

      // Delete connected edges
      const connectedEdges = await db.edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .toArray();
      for (const edge of connectedEdges) {
        await db.edges.delete(edge.id);
      }

      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setRefreshTrigger((prev) => prev + 1);
    },
    [setNodes, setEdges, setRefreshTrigger]
  );

  // Approve an AI suggested connection (turn into standard solid edge)
  const handleApproveAIEdge = useCallback(
    async (edgeId: string) => {
      const edge = await db.edges.get(edgeId);
      if (edge) {
        await db.edges.update(edgeId, { isAIProposed: false, animated: false });
        setEdges((eds) =>
          eds.map((e) =>
            e.id === edgeId
              ? {
                  ...e,
                  type: undefined,
                  animated: false,
                  style: undefined,
                  data: undefined,
                }
              : e
          )
        );
      }
    },
    [setEdges]
  );

  // Dismiss an AI connection suggestion
  const handleDismissAIEdge = useCallback(
    async (edgeId: string) => {
      await db.edges.delete(edgeId);
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  const refreshCanvasFromDB = useCallback(async () => {
    const dbNodes = await db.nodes.toArray();
    const dbEdges = await db.edges.toArray();

    // Map DB nodes to React Flow Nodes
    const flowNodes: Node[] = dbNodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      width: n.width,
      height: n.height,
      parentId: n.parentId,
      data: {
        ...n.data,
        onUpdate: handleNodeUpdate,
        onDelete: handleNodeDelete,
        isOllamaOnline,
      },
      style: n.type === 'clusterGroup' ? { width: n.width || 450, height: n.height || 380, zIndex: 1 } : { zIndex: 5 },
      dragHandle: n.type === 'clusterGroup' ? '.cluster-header' : undefined,
      extent: n.parentId ? 'parent' : undefined, // restrict nodes to stay in their cluster parent container if nested!
    }));

    // Map DB edges to React Flow Edges
    const flowEdges: Edge[] = dbEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.isAIProposed ? 'aiProposed' : undefined,
      animated: e.isAIProposed ? true : e.animated,
      style: e.isAIProposed
        ? { stroke: 'var(--accent-violet)', strokeWidth: 2.5 }
        : e.style,
      data: e.isAIProposed
        ? {
            reason: e.label,
            onConnect: handleApproveAIEdge,
            onDismiss: handleDismissAIEdge,
          }
        : undefined,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [
    isOllamaOnline,
    setNodes,
    setEdges,
    handleNodeUpdate,
    handleNodeDelete,
    handleApproveAIEdge,
    handleDismissAIEdge,
  ]);

  // Load and refresh when database changes or trigger changes
  useEffect(() => {
    refreshCanvasFromDB();
  }, [refreshTrigger, refreshCanvasFromDB]);


  // Connection created manually by user dragging
  const onConnect = useCallback(
    async (params: Connection) => {
      const edgeId = `edge-${Date.now()}`;
      const newEdge: LocalEdge = {
        id: edgeId,
        source: params.source || '',
        target: params.target || '',
        animated: false,
      };
      await db.edges.put(newEdge);
      setEdges((eds) => addEdge({ ...params, id: edgeId }, eds));
    },
    [setEdges]
  );

  // Save node position after dragging finishes
  const onNodeDragStop = useCallback(
    async (_event: any, draggedNode: Node) => {
      if (draggedNode.type === 'clusterGroup') {
        await db.nodes.update(draggedNode.id, {
          position: draggedNode.position,
        });
        return;
      }

      // Check if dropped inside a cluster group
      let parentId: string | undefined = undefined;
      let relativePosition = { ...draggedNode.position };

      const dbNodes = await db.nodes.toArray();
      const groupNodes = dbNodes.filter((n) => n.type === 'clusterGroup');

      for (const group of groupNodes) {
        const gx = group.position.x;
        const gy = group.position.y;
        const gw = group.width || 450;
        const gh = group.height || 380;

        const nx = draggedNode.position.x;
        const ny = draggedNode.position.y;

        // If the dragged node is within the cluster boundary:
        if (nx >= gx && nx <= gx + gw && ny >= gy && ny <= gy + gh) {
          parentId = group.id;
          // Sub-nodes positions are relative to the parent top-left
          relativePosition = {
            x: nx - gx,
            y: ny - gy,
          };
          break;
        }
      }

      await db.nodes.update(draggedNode.id, {
        position: relativePosition,
        parentId,
      });

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === draggedNode.id) {
            return { ...n, position: relativePosition, parentId };
          }
          return n;
        })
      );
      setRefreshTrigger((prev) => prev + 1);
    },
    [setNodes, setRefreshTrigger]
  );


  // Add node buttons handler (creates node near center of current screen)
  const addNode = async (type: 'textNote' | 'linkCard' | 'imageCard' | 'clusterGroup') => {
    // Get flow coords for center of viewport
    const flowPosition = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const nodeId = `${type}-${Date.now()}`;
    let newNode: LocalNode;

    if (type === 'clusterGroup') {
      newNode = {
        id: nodeId,
        type: 'clusterGroup',
        position: flowPosition,
        width: 450,
        height: 380,
        data: {
          title: 'New Cluster Group',
          content: '',
          clusterColor: 'violet',
        },
      };
    } else if (type === 'linkCard') {
      newNode = {
        id: nodeId,
        type: 'linkCard',
        position: flowPosition,
        data: {
          title: '',
          content: '',
          url: '',
          description: '',
          tags: [],
        },
      };
    } else if (type === 'imageCard') {
      newNode = {
        id: nodeId,
        type: 'imageCard',
        position: flowPosition,
        data: {
          title: '',
          content: '',
          imageUrl: '',
          tags: [],
        },
      };
    } else {
      newNode = {
        id: nodeId,
        type: 'textNote',
        position: flowPosition,
        data: {
          title: '',
          content: '',
          tags: [],
        },
      };
    }

    await db.nodes.put(newNode);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAnalyzeCanvas = async () => {
    setIsAnalyzing(true);
    try {
      const dbNodes = await db.nodes.toArray();
      const { suggestions, clusters } = await analyzeCanvasConnections(dbNodes);

      // 1. Process proposed edges
      const existingEdges = await db.edges.toArray();

      for (const sug of suggestions) {
        const duplicate = existingEdges.find(
          (e) =>
            (e.source === sug.sourceId && e.target === sug.targetId) ||
            (e.source === sug.targetId && e.target === sug.sourceId)
        );
        if (!duplicate) {
          const id = `ai-edge-${sug.sourceId}-${sug.targetId}`;
          const newEdge: LocalEdge = {
            id,
            source: sug.sourceId,
            target: sug.targetId,
            isAIProposed: true,
            label: sug.reason,
            animated: true,
          };
          await db.edges.put(newEdge);
        }
      }

      // 2. Process clusters
      for (const cluster of clusters) {
        if (cluster.nodeIds.length === 0) continue;

        const clusterNodes = dbNodes.filter((n) => cluster.nodeIds.includes(n.id));
        if (clusterNodes.length === 0) continue;

        // Resolve absolute coordinates
        const resolvedNodes = clusterNodes.map((node) => {
          let absX = node.position.x;
          let absY = node.position.y;
          if (node.parentId) {
            const parent = dbNodes.find((p) => p.id === node.parentId);
            if (parent) {
              absX += parent.position.x;
              absY += parent.position.y;
            }
          }
          return { ...node, absX, absY };
        });

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        resolvedNodes.forEach((n) => {
          if (n.absX < minX) minX = n.absX;
          if (n.absY < minY) minY = n.absY;
          if (n.absX > maxX) maxX = n.absX;
          if (n.absY > maxY) maxY = n.absY;
        });

        const padding = 60;
        const groupX = minX - padding;
        const groupY = minY - padding - 30;
        const groupW = Math.max(450, maxX - minX + padding * 2 + 150);
        const groupH = Math.max(380, maxY - minY + padding * 2 + 100);

        const clusterId = `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const newGroupNode: LocalNode = {
          id: clusterId,
          type: 'clusterGroup',
          position: { x: groupX, y: groupY },
          width: groupW,
          height: groupH,
          data: {
            title: cluster.theme,
            content: '',
            clusterColor: cluster.color,
          },
        };

        await db.nodes.put(newGroupNode);

        // Reparent child nodes
        for (const n of resolvedNodes) {
          await db.nodes.update(n.id, {
            parentId: clusterId,
            position: {
              x: n.absX - groupX,
              y: n.absY - groupY,
            },
          });
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Canvas analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoData = async () => {
    await db.nodes.clear();
    await db.edges.clear();

    const demoNodes: LocalNode[] = [
      {
        id: 'demo-1',
        type: 'textNote',
        position: { x: 100, y: 150 },
        data: {
          title: '✨ AI Personal Canvas Project',
          content: 'An infinite, visually rich personal knowledge workspace where users can map notes, links, and images. Powered by local Ollama AI.',
          tags: ['workspace', 'react', 'local-ai'],
        },
      },
      {
        id: 'demo-2',
        type: 'textNote',
        position: { x: 500, y: 150 },
        data: {
          title: '🔮 Local Ollama & Mistral',
          content: 'Runs the Mistral LLM model locally. Proposes conceptual connections and groups related notes into colored visual clusters.',
          tags: ['ollama', 'docker', 'mistral'],
        },
      },
      {
        id: 'demo-3',
        type: 'textNote',
        position: { x: 100, y: 480 },
        data: {
          title: '💾 Dexie.js & IndexedDB',
          content: 'Provides offline persistence. Notes, links, images, and visual connection links (edges) survive browser refreshes.',
          tags: ['database', 'offline-first', 'dexie'],
        },
      },
      {
        id: 'demo-4',
        type: 'linkCard',
        position: { x: 500, y: 480 },
        data: {
          title: 'React Flow Official Site',
          content: '',
          url: 'reactflow.dev',
          description: 'Highly customizable React library for building node-based editors, flowcharts, and interactive diagrams.',
          tags: ['frontend', 'library', 'visual'],
        },
      },

    ];

    const demoEdges: LocalEdge[] = [
      {
        id: 'demo-e1-2',
        source: 'demo-1',
        target: 'demo-2',
        animated: true,
      },
      {
        id: 'demo-e1-3',
        source: 'demo-1',
        target: 'demo-3',
        animated: false,
      },
    ];

    for (const node of demoNodes) {
      await db.nodes.put(node);
    }
    for (const edge of demoEdges) {
      await db.edges.put(edge);
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  const clearCanvas = async () => {
    if (confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      await db.nodes.clear();
      await db.edges.clear();
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className={`canvas-container ${isAnalyzing ? 'canvas-scanning-pulse' : ''}`}>
      <ReactFlow
        nodes={nodes}
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

      {/* Floating Left Control Sidebar */}
      <div className="left-sidebar glass-panel nodrag">
        <h2 className="sidebar-title">
          <Database className="icon" /> Canvas Hub
        </h2>

        <div className="status-bar">
          <span className={`status-dot ${isOllamaOnline ? 'online' : 'offline'}`} />
          <span>Local Ollama: {isOllamaOnline ? 'Connected' : 'Offline'}</span>
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
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">AI Actions</span>
          <button
            className="btn btn-primary"
            onClick={handleAnalyzeCanvas}
            disabled={!isOllamaOnline || isAnalyzing}
          >
            <Sparkles className={`icon-sm ${isAnalyzing ? 'spinning' : ''}`} />
            {isAnalyzing ? 'Scanning with Mistral...' : 'Analyze Canvas'}
          </button>
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadDemoData}>
            <RefreshCw className="icon-sm" /> Load Demo Canvas
          </button>
          <button className="btn btn-danger btn-sm" onClick={clearCanvas}>
            <Trash2 className="icon-sm" /> Reset Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component with ReactFlowProvider
export default function App() {
  const [isOllamaOnline, setIsOllamaOnline] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to your AI Personal Knowledge Canvas! Type a message below. I can answer questions about notes you map on the screen.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Ollama status on load and periodically
  useEffect(() => {
    const checkStatus = async () => {
      const online = await checkOllamaStatus();
      setIsOllamaOnline(online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      // Gather current nodes summary for Canvas Aware Chat
      const dbNodes = await db.nodes.toArray();
      const textNodes = dbNodes.filter((n) => n.type === 'textNote' || n.type === 'linkCard');

      let contextStr = '';
      if (textNodes.length > 0) {
        contextStr = `
You are helping the user manage their personal knowledge canvas.
Here is the current state of notes mapped on the user's canvas:
${textNodes
  .map(
    (n) =>
      `- [${n.type === 'textNote' ? 'Note' : 'Link'}] "${n.data.title || 'Untitled'}" : ${
        n.data.content || n.data.description || '(empty)'
      } (Tags: ${n.data.tags?.join(', ') || 'none'})`
  )
  .join('\n')}

Based on this current knowledge base:
`;
      }

      const fullPrompt = `${contextStr}User: ${userMsg}\n\nAssistant:`;
      const response = await askMistral(fullPrompt);

      setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Failed to communicate with local Mistral model. Ensure the Docker container is active.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app-container">
      <ReactFlowProvider>
        <CanvasWorkspace
          isOllamaOnline={isOllamaOnline}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
          refreshTrigger={refreshTrigger}
          setRefreshTrigger={setRefreshTrigger}
        />
      </ReactFlowProvider>

      {/* Right Sidebar Collapsible AI Chat */}
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
            <span className={`status-dot ${isOllamaOnline ? 'online' : 'offline'}`} />
            <span>Chat: {isOllamaOnline ? 'Canvas-Aware' : 'Offline'}</span>
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
              isOllamaOnline ? 'Ask about your notes...' : 'Ollama Offline...'
            }
            disabled={!isOllamaOnline || isChatLoading}
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
            disabled={!isOllamaOnline || isChatLoading || !chatInput.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
