import type { LocalNode, LLMConfig } from './db';

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
 * Pings the local Ollama instance status.
 */
export async function checkOllamaStatus(customUrl?: string): Promise<boolean> {
  const url = customUrl || '/api/ollama';
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (data.models && Array.isArray(data.models)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Route ask request dynamically based on LLM configuration settings.
 */
export async function askLLM(prompt: string, config: LLMConfig, jsonMode = false): Promise<string> {
  if (!config) {
    throw new Error('LLM configuration is missing.');
  }

  if (config.provider === 'ollama') {
    const url = config.url || '/api/ollama';
    const model = config.model || 'mistral';
    const response = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: jsonMode ? 'json' : undefined,
        options: { temperature: 0.2 }
      })
    });
    if (!response.ok) throw new Error(`Ollama model '${model}' failed to generate response.`);
    const data = await response.json();
    return data.response;
  }

  if (config.provider === 'gemini') {
    if (!config.apiKey) throw new Error('Gemini API key is required.');
    const model = config.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: jsonMode ? 'application/json' : 'text/plain',
          temperature: 0.2
        }
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${errData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini.');
    return text;
  }

  if (config.provider === 'openai') {
    if (!config.apiKey) throw new Error('OpenAI API key is required.');
    const model = config.model || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.2
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI.');
    return text;
  }

  throw new Error(`Unknown LLM provider: ${config.provider}`);
}

/**
 * Extracts 2 to 4 keywords/tags from a text note using the chosen LLM.
 */
export async function generateTagsForNode(title: string, content: string, config: LLMConfig): Promise<string[]> {
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
    const rawRes = await askLLM(prompt, config, true);
    const parsed = JSON.parse(rawRes);
    if (Array.isArray(parsed)) {
      return parsed.map(tag => String(tag).toLowerCase().trim());
    }
    return [];
  } catch (e) {
    console.error('LLM tag extraction failed: ', e);
    return [];
  }
}

/**
 * Summarizes the canvas and suggests semantic relationships and grouping clusters.
 */
export async function analyzeCanvasConnections(nodes: LocalNode[], config: LLMConfig): Promise<{ suggestions: AISuggestion[]; clusters: AICluster[] }> {
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
    const rawRes = await askLLM(prompt, config, true);
    const parsed = JSON.parse(rawRes);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      clusters: Array.isArray(parsed.clusters) ? parsed.clusters : []
    };
  } catch (e) {
    console.error('LLM canvas analysis failed: ', e);
    return { suggestions: [], clusters: [] };
  }
}
