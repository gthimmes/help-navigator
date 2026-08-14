/**
 * Minimal, dependency-free markdown renderer for help content.
 * All input is HTML-escaped before any markup is generated, so article
 * bodies can never inject script into the host app. Supported syntax:
 * headings (#-####), paragraphs, **bold**, *italic*, `code`, fenced code
 * blocks, links, images, ordered/unordered lists, blockquotes, and `---`.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c] as string);
}

const SAFE_URL = /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i;

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  return SAFE_URL.test(trimmed) ? trimmed : null;
}

// Placeholder delimiter for protected code spans: the NUL control character,
// stripped from input first so it can never collide with author text.
const NUL = String.fromCharCode(0);
const CODE_SPAN_PLACEHOLDER = new RegExp(NUL + '(\\d+)' + NUL, 'g');

/** Inline markdown within a line. Code spans are protected from other rules. */
function renderInline(text: string): string {
  const codeSpans: string[] = [];
  let s = escapeHtml(text.split(NUL).join(''));

  s = s.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSpans.push(`<code>${code}</code>`);
    return `${NUL}${codeSpans.length - 1}${NUL}`;
  });

  s = s.replace(/!\[([^\]]*)\]\(([^()\s]+)\)/g, (_m, alt: string, url: string) => {
    const u = safeUrl(url);
    return u ? `<img src="${u}" alt="${alt}" loading="lazy">` : alt;
  });

  s = s.replace(/\[([^\]]+)\]\(([^()\s]+)\)/g, (_m, label: string, url: string) => {
    const u = safeUrl(url);
    return u
      ? `<a href="${u}" target="_blank" rel="noopener noreferrer">${label}</a>`
      : label;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return s.replace(CODE_SPAN_PLACEHOLDER, (_m, i: string) => codeSpans[Number(i)] as string);
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let quote: string[] = [];
  let i = 0;

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`);
      quote = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  while (i < lines.length) {
    const line = lines[i] as string;

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushAll();
      const lang = fence[1] ? ` data-lang="${escapeHtml(fence[1])}"` : '';
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i] as string)) {
        code.push(lines[i] as string);
        i++;
      }
      i++; // skip closing fence
      out.push(`<pre${lang}><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = (heading[1] as string).length;
      out.push(`<h${level}>${renderInline(heading[2] as string)}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flushAll();
      out.push('<hr>');
      i++;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const type = bullet ? 'ul' : 'ol';
      if (listType !== type) {
        flushList();
        out.push(`<${type}>`);
        listType = type;
      }
      out.push(`<li>${renderInline((bullet ?? numbered)?.[1] as string)}</li>`);
      i++;
      continue;
    }

    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1] as string);
      i++;
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushAll();
      i++;
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
    i++;
  }

  flushAll();
  return out.join('\n');
}

/** Strip markdown syntax to plain text, for search indexing and snippets. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```\w*\n?([\s\S]*?)```/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/(\*\*|\*|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
