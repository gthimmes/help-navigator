import { describe, expect, it } from 'vitest';
import { renderMarkdown, stripMarkdown } from '../src/markdown';

describe('renderMarkdown', () => {
  it('renders headings, paragraphs and inline styles', () => {
    const html = renderMarkdown('# Title\n\nSome **bold** and *italic* and `code`.');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
  });

  it('escapes raw HTML so scripts cannot inject', () => {
    const html = renderMarkdown('<script>alert(1)</script> & <img onerror=x>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
  });

  it('blocks javascript: URLs but keeps safe links', () => {
    const html = renderMarkdown('[bad](javascript:alert%281%29) [good](https://example.com)');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<a href="javascript');
    expect(html).not.toContain('>bad</a>'); // label survives as plain text, no link
    expect(html).toContain('bad');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('renders fenced code blocks verbatim without inline formatting', () => {
    const html = renderMarkdown('```js\nconst a = "**not bold**";\n```');
    expect(html).toContain('data-lang="js"');
    expect(html).toContain('**not bold**');
    expect(html).not.toContain('<strong>');
  });

  it('does not apply emphasis inside code spans', () => {
    const html = renderMarkdown('Use `*args` and `**kwargs` here.');
    expect(html).toContain('<code>*args</code>');
    expect(html).toContain('<code>**kwargs</code>');
  });

  it('keeps plain numbers surrounded by spaces intact', () => {
    const html = renderMarkdown('There are 5 steps and `one` code span.');
    expect(html).toContain('There are 5 steps');
    expect(html).toContain('<code>one</code>');
  });

  it('renders ordered and unordered lists', () => {
    const html = renderMarkdown('- a\n- b\n\n1. one\n2. two');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>two</li>');
  });

  it('renders blockquotes and horizontal rules', () => {
    const html = renderMarkdown('> quoted text\n\n---');
    expect(html).toContain('<blockquote><p>quoted text</p></blockquote>');
    expect(html).toContain('<hr>');
  });
});

describe('stripMarkdown', () => {
  it('flattens markdown to searchable plain text', () => {
    const text = stripMarkdown('# Head\n\nSome **bold** [link](https://x.com) and `code`.');
    expect(text).toBe('Head Some bold link and code.');
  });
});
