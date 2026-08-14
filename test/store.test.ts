import { describe, expect, it } from 'vitest';
import { ContentStore } from '../src/store';
import type { HelpContent } from '../src/types';

const content: HelpContent = {
  categories: [
    { id: 'billing', title: 'Billing', icon: '💳' },
    { id: 'empty-cat', title: 'Nothing here' },
  ],
  articles: [
    { id: 'a1', title: 'Invoices', body: 'x', category: 'billing', tags: ['money'], featured: true },
    { id: 'a2', title: 'Refunds', body: 'x', category: 'billing', tags: ['money'], related: ['a1'] },
    { id: 'a3', title: 'Shortcuts', body: 'x', category: 'productivity-tips' },
    { id: 'a4', title: 'Loose article', body: 'x' },
  ],
};

describe('ContentStore', () => {
  const store = new ContentStore(content);

  it('auto-creates categories referenced by articles', () => {
    expect(store.getCategory('productivity-tips')?.title).toBe('Productivity tips');
  });

  it('puts uncategorized articles in a General category', () => {
    const general = store.categories.find((c) => c.title === 'General');
    expect(general).toBeDefined();
    expect(store.articlesIn(general!.id).map((a) => a.id)).toEqual(['a4']);
  });

  it('drops declared categories with no articles', () => {
    expect(store.categories.find((c) => c.id === 'empty-cat')).toBeUndefined();
  });

  it('rejects duplicate article ids', () => {
    expect(
      () => new ContentStore({ articles: [{ id: 'dup', title: 'x', body: 'x' }, { id: 'dup', title: 'y', body: 'y' }] }),
    ).toThrow(/duplicate/);
  });

  it('returns featured articles', () => {
    expect(store.featured().map((a) => a.id)).toEqual(['a1']);
  });

  it('resolves explicit related articles, then tag/category neighbors', () => {
    const a2 = store.getArticle('a2')!;
    const related = store.related(a2);
    expect(related[0]?.id).toBe('a1'); // explicit
  });

  it('computes prev/next within a category', () => {
    const a2 = store.getArticle('a2')!;
    const { prev, next } = store.siblings(a2);
    expect(prev?.id).toBe('a1');
    expect(next).toBeUndefined();
  });
});
