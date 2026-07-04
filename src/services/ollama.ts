import type { LocalNode } from './db';


export interface AISuggestion {
  sourceId: string;
  targetId: string;
  reason: string;
}

export interface AICluster {
  nodeIds: string[];
  theme: string;
  color: string;
}

/**
 * Checks if Ollama is running and has the Mistral model loaded.
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/ollama/api/tags', {
      method: 'GET',
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (data.models && Array.isArray(data.models)) {
      return data.models.some((m: any) => 
        m.name.startsWith('mistral') || (m.model && m.model.startsWith('mistral'))
      );
    }
    return false;
  } catch {
    return false;
  }
}


/**
 * Sends a generation prompt to local Mistral.
 */
export async function askMistral(prompt: string, jsonMode = false): Promise<string> {
  const response = await fetch('/api/ollama/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral',
      prompt: prompt,
      stream: false,
      format: jsonMode ? 'json' : undefined,
      options: { temperature: 0.2 }
    })
  });
  
  if (!response.ok) throw new Error('Failed to query local Mistral model.');
  const data = await response.json();
  return data.response;
}

/**
 * Extracts 2 to 4 keywords/tags from a text note.
 */
export async function generateTagsForNode(title: string, content: string): Promise<string[]> {
  if (!title && !content) return [];
  const prompt = `
  Analyze this short note card and extract 2 to 4 simple, concise keywords or tags that represent its core topics.
  
  Title: "${title || 'Untitled'}"
  Content: "${content || ''}"

  Respond strictly with a JSON array of strings, e.g.:
  ["react", "database", "ui-design"]
  Do not include markdown code block formatting (such as \`\`\`json) or conversational prefaces. Return raw JSON.
  `;
  try {
    const rawRes = await askMistral(prompt, true);
    const parsed = JSON.parse(rawRes);
    if (Array.isArray(parsed)) {
      return parsed.map(tag => String(tag).toLowerCase().trim());
    }
    return [];
  } catch (e) {
    console.error('Ollama tag extraction failed: ', e);
    return [];
  }
}

/**
 * Summarizes the canvas and suggests semantic relationships and grouping clusters.
 */
export async function analyzeCanvasConnections(nodes: LocalNode[]): Promise<{ suggestions: AISuggestion[]; clusters: AICluster[] }> {
  // Only analyze text content nodes (textNote, linkCard)
  const textNodes = nodes.filter(n => n.type === 'textNote' || n.type === 'linkCard');
  if (textNodes.length < 2) return { suggestions: [], clusters: [] };

  const nodesSummary = textNodes.map(n => ({
    id: n.id,
    title: n.data.title || 'Untitled',
    content: n.data.content || n.data.description || ''
  }));

  const prompt = `
  You are an AI assistant helping a user map their personal knowledge database. 
  Here is a list of note cards present on the user's visual canvas in JSON format:
  ${JSON.stringify(nodesSummary, null, 2)}

  Your task is two-fold:
  1. Identify logical, conceptual, or thematic connections between cards that might not be obvious. Suggest 1 to 4 connections. Provide a short "reason" (max 10 words) for each.
  2. Group related cards into 1 or 2 conceptual clusters. Assign a theme name and a color palette name (emerald, amber, violet, terracotta, ocean) to each cluster.

  Respond strictly with a JSON object in this format:
  {
    "suggestions": [
      { "sourceId": "id-1", "targetId": "id-2", "reason": "Reason for link" }
    ],
    "clusters": [
      { "nodeIds": ["id-1", "id-3"], "theme": "Theme Name", "color": "emerald" }
    ]
  }
  Do not return markdown format wrappers or conversational prefaces. Return raw JSON.
  `;

  try {
    const rawRes = await askMistral(prompt, true);
    const parsed = JSON.parse(rawRes);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      clusters: Array.isArray(parsed.clusters) ? parsed.clusters : []
    };
  } catch (e) {
    console.error('Ollama canvas analysis failed: ', e);
    return { suggestions: [], clusters: [] };
  }
}
