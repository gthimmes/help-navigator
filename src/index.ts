import { Emitter, type Listener } from './emitter';
import { createSearchIndex, type SearchIndex } from './search';
import { ContentStore } from './store';
import type {
  HelpContent,
  HelpEventName,
  HelpNavigatorOptions,
  HelpTexts,
} from './types';
import { HelpUI } from './ui';

export * from './types';
export { renderMarkdown, stripMarkdown } from './markdown';
export { createSearchIndex } from './search';
export { ContentStore } from './store';

const DEFAULT_TEXTS: HelpTexts = {
  launcherLabel: 'Open help',
  panelTitle: 'Help',
  searchPlaceholder: 'Search help articles…',
  suggestedTitle: 'Suggested for this page',
  featuredTitle: 'Popular articles',
  categoriesTitle: 'Browse by topic',
  backLabel: 'Back',
  closeLabel: 'Close help',
  noResults: 'No articles found. Try different keywords.',
  resultsTitle: 'Search results',
  relatedTitle: 'Related articles',
  feedbackPrompt: 'Was this article helpful?',
  feedbackYes: 'Yes',
  feedbackNo: 'No',
  feedbackThanks: 'Thanks for the feedback!',
  prevLabel: 'Previous',
  nextLabel: 'Next',
  updatedLabel: 'Updated',
  loading: 'Loading help content…',
  loadError: 'Help content could not be loaded.',
  articleCount: (n) => (n === 1 ? '1 article' : `${n} articles`),
  hotkeyHint: 'Toggle with',
};

/**
 * The public entry point. Create one per page:
 *
 * ```ts
 * import { HelpNavigator } from 'help-navigator';
 * const help = HelpNavigator.init({ content: myContent });
 * help.on('feedback', ({ articleId, helpful }) => track(articleId, helpful));
 * ```
 */
export class HelpNavigator {
  private readonly emitter = new Emitter();
  private readonly ui: HelpUI;
  private store: ContentStore | null = null;
  private index: SearchIndex | null = null;
  private destroyed = false;

  private constructor(private readonly options: HelpNavigatorOptions) {
    const texts: HelpTexts = { ...DEFAULT_TEXTS, ...(options.texts ?? {}) };
    this.ui = new HelpUI(
      {
        position: options.position ?? 'bottom-right',
        theme: options.theme ?? 'auto',
        accentColor: options.accentColor,
        launcher: options.launcher !== false,
        hotkey: options.hotkey === undefined ? 'F1' : options.hotkey,
        zIndex: options.zIndex,
        texts,
      },
      this.emitter,
      options.attributeTriggers !== false,
    );
    if (options.context?.length) this.ui.setContext(options.context);
    void this.loadContent(options.content);
  }

  static init(options: HelpNavigatorOptions): HelpNavigator {
    return new HelpNavigator(options);
  }

  private async loadContent(source: HelpContent | string): Promise<void> {
    try {
      let content: HelpContent;
      if (typeof source === 'string') {
        const res = await fetch(source);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${source}`);
        content = (await res.json()) as HelpContent;
      } else {
        content = source;
      }
      if (this.destroyed) return;
      this.applyContent(content);
    } catch (err) {
      if (this.destroyed) return;
      this.ui.setLoadFailed();
      this.emitter.emit('error', { message: err instanceof Error ? err.message : String(err) });
    }
  }

  private applyContent(content: HelpContent): void {
    const store = new ContentStore(content);
    const index = createSearchIndex(
      store.articles.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        tags: a.tags,
        categoryTitle: store.categoryOf(a)?.title,
      })),
    );
    this.store = store;
    this.index = index;
    this.ui.setContent(store, index);
    this.emitter.emit('ready', { articles: store.articles.length });
  }

  /** Swap in new content at runtime (e.g. after a locale change). */
  setContent(content: HelpContent): void {
    this.applyContent(content);
  }

  /** Set the "Suggested for this page" articles; call on route changes. */
  setContext(articleIds: string[]): void {
    this.ui.setContext(articleIds);
  }

  open(): void {
    this.ui.open('api');
  }

  close(): void {
    this.ui.close();
  }

  toggle(): void {
    this.ui.toggle();
  }

  get isOpen(): boolean {
    return this.ui.isOpen;
  }

  openArticle(id: string): void {
    this.ui.goHome();
    this.ui.goArticle(id);
    this.ui.open('api');
  }

  openCategory(id: string): void {
    this.ui.goHome();
    this.ui.goCategory(id);
    this.ui.open('api');
  }

  /** Programmatic search; opens the panel showing results. */
  search(query: string): void {
    this.ui.open('api');
    this.ui.goSearch(query);
  }

  on<E extends HelpEventName>(event: E, listener: Listener<E>): () => void {
    return this.emitter.on(event, listener);
  }

  /** Remove the widget and all document-level listeners. */
  destroy(): void {
    this.destroyed = true;
    this.ui.destroy();
    this.emitter.clear();
  }
}

/**
 * Optional declarative usage:
 * `<help-navigator src="/help.json" position="bottom-left" theme="dark" accent="#0ea5e9"></help-navigator>`
 * Call this once to register the custom element.
 */
export function defineHelpNavigatorElement(tagName = 'help-navigator'): void {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return;

  class HelpNavigatorElement extends HTMLElement {
    private instance: HelpNavigator | null = null;

    connectedCallback(): void {
      const src = this.getAttribute('src');
      if (!src) {
        console.error('help-navigator: <help-navigator> requires a src attribute');
        return;
      }
      this.instance = HelpNavigator.init({
        content: src,
        position: (this.getAttribute('position') as 'bottom-left' | null) ?? undefined,
        theme: (this.getAttribute('theme') as 'dark' | null) ?? undefined,
        accentColor: this.getAttribute('accent') ?? undefined,
        hotkey: this.hasAttribute('no-hotkey') ? false : this.getAttribute('hotkey') ?? undefined,
      });
    }

    disconnectedCallback(): void {
      this.instance?.destroy();
      this.instance = null;
    }
  }

  customElements.define(tagName, HelpNavigatorElement);
}
