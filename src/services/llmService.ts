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
export async function askLLM(
  promptOrMessages: string | { role: 'system' | 'user' | 'assistant'; content: string }[],
  config: LLMConfig,
  jsonMode = false
): Promise<string> {
  if (!config) {
    throw new Error('LLM configuration is missing.');
  }

  const messages = typeof promptOrMessages === 'string'
    ? [{ role: 'user' as const, content: promptOrMessages }]
    : promptOrMessages;

  if (config.provider === 'ollama') {
    const url = config.url || '/api/ollama';
    const model = config.model || 'mistral';
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
        format: jsonMode ? 'json' : undefined,
        options: { temperature: 0.2 }
      })
    });
    if (!response.ok) throw new Error(`Ollama model '${model}' failed to generate response.`);
    const data = await response.json();
    return data.message.content;
  }

  if (config.provider === 'gemini') {
    if (!config.apiKey) throw new Error('Gemini API key is required.');
    const model = config.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
    
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const contents = conversationMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: '' }] });
    }

    const body: any = {
      contents,
      generationConfig: {
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
        temperature: 0.2
      }
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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
        messages: messages,
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

/**
 * Compiles the conversational system instructions and canvas context payload.
 */
export function buildAssistantPrompt(
  canvasNodes: any[],
  canvasEdges: any[],
  userQuery: string,
  retrievedChunks: string[] = []
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  let systemInstruction = `You are "Canvas Companion," a warm, creative, and highly visual brainstorming partner. You are looking at an infinite knowledge canvas side-by-side with the user.

CRITICAL GUIDELINES:
1. DO NOT speak like an API or machine. Never say "Based on the provided canvas state...", "In the JSON data...", or "According to your nodes...".
2. Speak naturally, as if you are in the room. E.g., instead of "You have a node named React", say "I see your note on React. That's a great starting point!".
3. Keep responses extremely short, visually structured, and easy to scan. Use bullet points (-), bold text (**), and 1-2 friendly emojis.
4. End your response with a brief, actionable question or tip to keep the user's creative momentum going.
5. If the user asks 'how to use this' or 'tell me about this', tailor your answer dynamically to what is CURRENTLY on the canvas:
   - If empty (0 nodes): Welcome the user to their blank canvas. Provide 3 quick, bulleted actions they can perform right now. Offer to kickstart the canvas by generating a structure (e.g., "Would you like me to write a template node for career planning, a project roadmap, or study topics?").
   - If 1 node: Acknowledge what the node is (referencing its title). Proactively offer to expand it (e.g., generate 3 subtopics or draft some initial body content for it).
   - If multiple nodes (unconnected): Mention the cards by name and briefly suggest how they might relate. Remind the user they can draw lines between them, or click "Analyze Canvas" on the left to let the AI draft connections.
   - If connected nodes: Summarize the emerging web of thoughts. Point out any "lonely" nodes that don't have connections yet, asking how they fit into the bigger picture.
6. Output formatting: You MUST use double-newlines (\\n\\n) between separate ideas, numbered points, or bullet list items. Do not merge list items into a single paragraph.`;

  if (retrievedChunks.length > 0) {
    systemInstruction += `\n\nADDITIONAL CONTEXT (RAG):
You have searched the user's canvas and found these highly relevant notes/documents. Use these facts to answer the user's question accurately:
---
${retrievedChunks.join('\n\n')}
---
If the context doesn't contain the answer, use your general knowledge but mention that it was not found in their canvas documents.`;
  }

  const userContent = `Here is the current state of my canvas:
Nodes:
${JSON.stringify(canvasNodes)}

Edges/Connections:
${JSON.stringify(canvasEdges)}

User Question: ${userQuery}`;

  return [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: userContent }
  ];
}

export interface InferredMetadata {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Uses the configured LLM to infer a title, description, and tags for a bookmark URL.
 */
export async function generateUrlMetadata(
  url: string,
  config: LLMConfig
): Promise<InferredMetadata> {
  const prompt = `Analyze this URL: "${url}". 
Provide a JSON object containing:
{
  "title": "A concise title inferred from the URL (e.g., Python Tutorial)",
  "description": "A 1-sentence summary of what this website likely contains",
  "tags": ["3-5", "relevant", "lowercase", "keywords"]
}
Respond strictly in raw JSON format. Do not return markdown wrappers or conversational prefaces.`;

  try {
    const rawRes = await askLLM(prompt, config, true);
    // Strip code block backticks if LLM returns them despite constraints
    const cleaned = rawRes.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || 'Inferred Bookmark',
      description: parsed.description || `Bookmark for ${url}`,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: string) => t.toLowerCase()) : []
    };
  } catch (e) {
    console.error('LLM URL metadata generation failed: ', e);
    return {
      title: 'Bookmark',
      description: `Reference link: ${url}`,
      tags: []
    };
  }
}

