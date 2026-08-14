import { describe, expect, it } from 'vitest';
import { createSearchIndex, tokenize } from '../src/search';

const docs = [
  {
    id: 'billing-invoices',
    title: 'Understanding your invoice',
    body: 'Your invoice lists all charges for the billing period. Download invoices as PDF from the billing page.',
    tags: ['billing', 'pdf'],
    categoryTitle: 'Billing',
  },
  {
    id: 'reset-password',
    title: 'Reset your password',
    body: 'Click "Forgot password" on the sign-in screen to receive a reset email.',
    tags: ['account', 'security'],
    categoryTitle: 'Account',
  },
  {
    id: 'export-data',
    title: 'Exporting your data',
    body: 'You can export reports to CSV or PDF. Exports include invoice history.',
    tags: ['export'],
    categoryTitle: 'Reports',
  },
];

describe('tokenize', () => {
  it('lowercases and splits on non-alphanumerics', () => {
    expect(tokenize('Hello, World-2!')).toEqual(['hello', 'world', '2']);
  });
});

describe('createSearchIndex', () => {
  const index = createSearchIndex(docs);

  it('ranks title matches above body matches', () => {
    const results = index.search('invoice');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]?.id).toBe('billing-invoices');
  });

  it('supports prefix matching for search-as-you-type', () => {
    const results = index.search('passw');
    expect(results[0]?.id).toBe('reset-password');
  });

  it('requires every query token to match', () => {
    expect(index.search('invoice zebra')).toHaveLength(0);
  });

  it('matches tags', () => {
    const results = index.search('security');
    expect(results[0]?.id).toBe('reset-password');
  });

  it('highlights matches in title and snippet', () => {
    const results = index.search('invoice');
    expect(results[0]?.titleHtml).toContain('<mark>invoice</mark>');
    expect(results[0]?.snippetHtml).toContain('<mark>');
  });

  it('escapes HTML in snippets', () => {
    const idx = createSearchIndex([
      { id: 'x', title: 'XSS <img>', body: 'dangerous <script>alert(1)</script> content' },
    ]);
    const results = idx.search('dangerous');
    expect(results[0]?.snippetHtml).not.toContain('<script>');
    expect(results[0]?.titleHtml).toContain('&lt;img&gt;');
  });

  it('returns empty for empty queries', () => {
    expect(index.search('   ')).toHaveLength(0);
  });
});
