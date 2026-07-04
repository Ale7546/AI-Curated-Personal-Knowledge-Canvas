import type { LocalNode } from './db';

// Simple list of common English stop words to filter out for index size/accuracy
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
  'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
  'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Normalizes text, splits into alphanumeric tokens, and filters stop words.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

export interface SearchResult {
  node: LocalNode;
  score: number;
}

/**
 * Returns the top N nodes that are most relevant to the query.
 * Uses a basic TF-IDF similarity model.
 */
export function retrieveContext(query: string, nodes: LocalNode[], limit = 3): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Filter nodes that actually contain text
  const textNodes = nodes.filter(node => 
    node.type === 'textNote' || 
    node.type === 'documentCard' || 
    node.type === 'linkCard'
  );

  if (textNodes.length === 0) return [];

  // 1. Calculate TF (Term Frequency) for each document
  // Boost fields: Title * 3, Tags * 2, Content/Description * 1
  const documentsTF = textNodes.map(node => {
    const titleText = node.data.title || '';
    const tagsText = (node.data.tags || []).join(' ');
    const bodyText = node.data.content || node.data.description || '';

    const titleTokens = tokenize(titleText);
    const tagsTokens = tokenize(tagsText);
    const bodyTokens = tokenize(bodyText);

    const termCounts: Record<string, number> = {};
    let totalTerms = 0;

    const addTokens = (tokens: string[], weight: number) => {
      tokens.forEach(token => {
        termCounts[token] = (termCounts[token] || 0) + weight;
        totalTerms += weight;
      });
    };

    addTokens(titleTokens, 3);
    addTokens(tagsTokens, 2);
    addTokens(bodyTokens, 1);

    const tf: Record<string, number> = {};
    for (const term in termCounts) {
      tf[term] = termCounts[term] / (totalTerms || 1);
    }

    return { node, tf };
  });

  // 2. Calculate IDF (Inverse Document Frequency) for each term in the query
  const idf: Record<string, number> = {};
  const numDocs = textNodes.length;

  queryTokens.forEach(token => {
    let docsWithTerm = 0;
    documentsTF.forEach(doc => {
      if (doc.tf[token] > 0) docsWithTerm++;
    });

    // Inverse Document Frequency with smoothing
    idf[token] = Math.log((numDocs + 1) / (docsWithTerm + 1)) + 1;
  });

  // 3. Compute score for each document (TF * IDF dot product)
  const results: SearchResult[] = documentsTF.map(doc => {
    let score = 0;
    queryTokens.forEach(token => {
      if (doc.tf[token]) {
        score += doc.tf[token] * idf[token];
      }
    });

    return {
      node: doc.node,
      score
    };
  });

  // Sort and return top N
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
