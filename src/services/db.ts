import Dexie, { type Table } from 'dexie';

export interface CanvasNodeData {
  title: string;
  content: string;
  tags?: string[];
  imageUrl?: string; // base64 string or URL
  url?: string;      // URL for bookmark nodes
  description?: string;
  clusterColor?: string; // group background color palette (emerald, amber, violet, terracotta, ocean)
}

export interface LocalNode {
  id: string;
  type: 'textNote' | 'linkCard' | 'imageCard' | 'clusterGroup';
  position: { x: number; y: number };
  width?: number;
  height?: number;
  parentId?: string; // for React Flow sub-grouping
  data: CanvasNodeData;
}

export interface LocalEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  isAIProposed?: boolean; // helps identify dashed AI links
  label?: string; // AI's connection reasoning
}

class KnowledgeCanvasDatabase extends Dexie {
  nodes!: Table<LocalNode>;
  edges!: Table<LocalEdge>;

  constructor() {
    super('KnowledgeCanvasDB');
    this.version(1).stores({
      nodes: 'id, type, parentId',
      edges: 'id, source, target'
    });
  }
}

export const db = new KnowledgeCanvasDatabase();
