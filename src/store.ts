import type { HelpArticle, HelpCategory, HelpContent } from './types';

const UNCATEGORIZED_ID = '__general__';

function titleFromId(id: string): string {
  const words = id.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Normalized, queryable view over a HelpContent document. Categories
 * referenced by articles but not declared are auto-created; articles with
 * no category land in a synthetic "General" category.
 */
export class ContentStore {
  readonly categories: HelpCategory[];
  readonly articles: HelpArticle[];
  private readonly articleById = new Map<string, HelpArticle>();
  private readonly categoryById = new Map<string, HelpCategory>();
  private readonly articlesByCategory = new Map<string, HelpArticle[]>();

  constructor(content: HelpContent) {
    this.articles = [...(content.articles ?? [])];
    const declared = content.categories ?? [];
    const categories: HelpCategory[] = [...declared];

    for (const cat of categories) this.categoryById.set(cat.id, cat);

    for (const article of this.articles) {
      if (this.articleById.has(article.id)) {
        throw new Error(`help-navigator: duplicate article id "${article.id}"`);
      }
      this.articleById.set(article.id, article);

      const catId = article.category ?? UNCATEGORIZED_ID;
      if (!this.categoryById.has(catId)) {
        const cat: HelpCategory = {
          id: catId,
          title: catId === UNCATEGORIZED_ID ? 'General' : titleFromId(catId),
        };
        this.categoryById.set(catId, cat);
        categories.push(cat);
      }
      const list = this.articlesByCategory.get(catId) ?? [];
      list.push(article);
      this.articlesByCategory.set(catId, list);
    }

    // Keep declared order; drop declared categories that ended up empty.
    this.categories = categories.filter(
      (c) => (this.articlesByCategory.get(c.id) ?? []).length > 0,
    );
  }

  getArticle(id: string): HelpArticle | undefined {
    return this.articleById.get(id);
  }

  getCategory(id: string): HelpCategory | undefined {
    return this.categoryById.get(id);
  }

  articlesIn(categoryId: string): HelpArticle[] {
    return this.articlesByCategory.get(categoryId) ?? [];
  }

  categoryOf(article: HelpArticle): HelpCategory | undefined {
    return this.categoryById.get(article.category ?? UNCATEGORIZED_ID);
  }

  featured(limit = 5): HelpArticle[] {
    return this.articles.filter((a) => a.featured).slice(0, limit);
  }

  related(article: HelpArticle, limit = 4): HelpArticle[] {
    const explicit = (article.related ?? [])
      .map((id) => this.articleById.get(id))
      .filter((a): a is HelpArticle => !!a && a.id !== article.id);
    if (explicit.length >= limit) return explicit.slice(0, limit);

    // Fill remaining slots with tag-overlap neighbors.
    const chosen = new Set(explicit.map((a) => a.id));
    chosen.add(article.id);
    const tags = new Set(article.tags ?? []);
    const scored = this.articles
      .filter((a) => !chosen.has(a.id))
      .map((a) => ({
        a,
        overlap: (a.tags ?? []).filter((t) => tags.has(t)).length,
        sameCategory: a.category === article.category ? 1 : 0,
      }))
      .filter((x) => x.overlap > 0 || x.sameCategory > 0)
      .sort((x, y) => y.overlap - x.overlap || y.sameCategory - x.sameCategory);

    return [...explicit, ...scored.map((x) => x.a)].slice(0, limit);
  }

  /** Previous/next article within the same category, for footer navigation. */
  siblings(article: HelpArticle): { prev?: HelpArticle; next?: HelpArticle } {
    const list = this.articlesIn(article.category ?? UNCATEGORIZED_ID);
    const idx = list.findIndex((a) => a.id === article.id);
    if (idx === -1) return {};
    return { prev: list[idx - 1], next: list[idx + 1] };
  }
}
