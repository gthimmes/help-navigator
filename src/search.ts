/**
 * Tiny client-side full-text search over help articles.
 * Scoring favors title matches, then tags, then body occurrences, with a
 * phrase bonus when the whole query appears in the title. Every query token
 * must match somewhere (exact or prefix) for a document to qualify.
 */
import { escapeHtml, stripMarkdown } from './markdown';

export interface SearchDoc {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  categoryTitle?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  /** Title with query tokens wrapped in <mark>, HTML-escaped. */
  titleHtml: string;
  /** Short body excerpt around the first match, with <mark> highlights. */
  snippetHtml: string;
  categoryTitle?: string;
}

interface IndexedDoc {
  id: string;
  title: string;
  titleLower: string;
  titleTokens: string[];
  tagTokens: string[];
  bodyText: string;
  bodyLower: string;
  bodyCounts: Map<string, number>;
  categoryTitle?: string;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0);
}

function highlight(text: string, tokens: string[]): string {
  if (!tokens.length) return escapeHtml(text);
  const pattern = tokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');
  const re = new RegExp(`(${pattern})`, 'gi');
  return text
    .split(re)
    .map((part, idx) => (idx % 2 === 1 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('');
}

function makeSnippet(doc: IndexedDoc, tokens: string[]): string {
  const RADIUS = 70;
  let pos = -1;
  for (const t of tokens) {
    const p = doc.bodyLower.indexOf(t);
    if (p !== -1 && (pos === -1 || p < pos)) pos = p;
  }
  if (pos === -1) pos = 0;
  const start = Math.max(0, pos - RADIUS);
  const end = Math.min(doc.bodyText.length, pos + RADIUS * 2);
  let snippet = doc.bodyText.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < doc.bodyText.length) snippet = `${snippet}…`;
  return highlight(snippet, tokens);
}

export interface SearchIndex {
  search(query: string, limit?: number): SearchResult[];
}

export function createSearchIndex(docs: SearchDoc[]): SearchIndex {
  const indexed: IndexedDoc[] = docs.map((d) => {
    const bodyText = stripMarkdown(d.body);
    const bodyCounts = new Map<string, number>();
    for (const t of tokenize(bodyText)) {
      bodyCounts.set(t, (bodyCounts.get(t) ?? 0) + 1);
    }
    return {
      id: d.id,
      title: d.title,
      titleLower: d.title.toLowerCase(),
      titleTokens: tokenize(d.title),
      tagTokens: (d.tags ?? []).flatMap(tokenize),
      bodyText,
      bodyLower: bodyText.toLowerCase(),
      bodyCounts,
      categoryTitle: d.categoryTitle,
    };
  });

  return {
    search(query: string, limit = 8): SearchResult[] {
      const tokens = tokenize(query);
      if (!tokens.length) return [];
      const queryLower = query.trim().toLowerCase();
      const results: SearchResult[] = [];

      for (const doc of indexed) {
        let score = 0;
        let allMatched = true;

        for (const token of tokens) {
          let matched = false;
          if (doc.titleTokens.includes(token)) {
            score += 10;
            matched = true;
          } else if (doc.titleTokens.some((t) => t.startsWith(token))) {
            score += 6;
            matched = true;
          }
          if (doc.tagTokens.some((t) => t === token || t.startsWith(token))) {
            score += 5;
            matched = true;
          }
          const bodyExact = doc.bodyCounts.get(token) ?? 0;
          if (bodyExact > 0) {
            score += Math.min(bodyExact, 5);
            matched = true;
          } else if (!matched && doc.bodyLower.includes(token)) {
            // prefix-of-word match in body, cheap containment check
            score += 1;
            matched = true;
          }
          if (!matched) {
            allMatched = false;
            break;
          }
        }

        if (!allMatched || score === 0) continue;
        if (tokens.length > 1 && doc.titleLower.includes(queryLower)) score += 15;

        results.push({
          id: doc.id,
          score,
          titleHtml: highlight(doc.title, tokens),
          snippetHtml: makeSnippet(doc, tokens),
          categoryTitle: doc.categoryTitle,
        });
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    },
  };
}
