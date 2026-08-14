import type { Emitter } from './emitter';
import { escapeHtml, renderMarkdown, stripMarkdown } from './markdown';
import type { SearchIndex } from './search';
import type { ContentStore } from './store';
import { STYLES } from './styles';
import type { HelpArticle, HelpTexts, LauncherPosition, ThemeMode } from './types';

export interface UIOptions {
  position: LauncherPosition;
  theme: ThemeMode;
  accentColor?: string;
  launcher: boolean;
  hotkey: string | false;
  zIndex?: number;
  texts: HelpTexts;
}

type View =
  | { kind: 'home' }
  | { kind: 'category'; id: string }
  | { kind: 'article'; id: string }
  | { kind: 'search'; query: string };

const ICONS = {
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M9.3 9.2a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.2 1-1.2 1.9v.3"/><circle cx="12" cy="17.2" r="0.4" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>',
  chevron: '<svg class="hn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
};

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  );
}

export class HelpUI {
  private readonly host: HTMLElement;
  private readonly shadow: ShadowRoot;
  private readonly root: HTMLDivElement;
  private launcherBtn: HTMLButtonElement | null = null;
  private panel!: HTMLElement;
  private titleEl!: HTMLElement;
  private backBtn!: HTMLButtonElement;
  private searchInput!: HTMLInputElement;
  private bodyEl!: HTMLElement;

  private store: ContentStore | null = null;
  private index: SearchIndex | null = null;
  private loadFailed = false;
  private contextIds: string[] = [];
  private stack: View[] = [{ kind: 'home' }];
  private openState = false;
  private lastFocused: Element | null = null;

  private readonly onDocKeydown = (e: KeyboardEvent) => this.handleDocKeydown(e);
  private readonly onDocClick = (e: MouseEvent) => this.handleAttributeTrigger(e);

  constructor(
    private readonly opts: UIOptions,
    private readonly emitter: Emitter,
    private readonly attributeTriggers: boolean,
  ) {
    this.host = document.createElement('help-navigator-root');
    this.host.setAttribute('data-hn-theme', opts.theme);
    if (opts.accentColor) this.host.style.setProperty('--hn-accent', opts.accentColor);
    if (opts.zIndex !== undefined) this.host.style.setProperty('--hn-z', String(opts.zIndex));
    this.shadow = this.host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    this.shadow.appendChild(styleEl);

    this.root = document.createElement('div');
    this.root.className = `hn-root ${opts.position === 'bottom-left' ? 'hn-pos-left' : 'hn-pos-right'}`;
    this.shadow.appendChild(this.root);

    this.buildDom();
    document.body.appendChild(this.host);

    if (opts.hotkey !== false) document.addEventListener('keydown', this.onDocKeydown);
    if (this.attributeTriggers) document.addEventListener('click', this.onDocClick, true);
  }

  // ----- lifecycle -----

  setContent(store: ContentStore, index: SearchIndex): void {
    this.store = store;
    this.index = index;
    this.loadFailed = false;
    this.render();
  }

  setLoadFailed(): void {
    this.loadFailed = true;
    this.render();
  }

  setContext(ids: string[]): void {
    this.contextIds = ids;
    if (this.current.kind === 'home') this.render();
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onDocKeydown);
    document.removeEventListener('click', this.onDocClick, true);
    this.host.remove();
  }

  // ----- open/close -----

  get isOpen(): boolean {
    return this.openState;
  }

  open(via: 'launcher' | 'api' | 'hotkey' | 'attribute' = 'api'): void {
    if (this.openState) return;
    this.openState = true;
    this.lastFocused = document.activeElement;
    this.root.classList.add('hn-open');
    this.panel.removeAttribute('aria-hidden');
    this.panel.removeAttribute('inert');
    this.updateLauncher();
    this.emitter.emit('open', { via });
    requestAnimationFrame(() => this.searchInput?.focus());
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.root.classList.remove('hn-open');
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.setAttribute('inert', '');
    this.updateLauncher();
    this.emitter.emit('close', {});
    const back = this.lastFocused as HTMLElement | null;
    if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    else this.launcherBtn?.focus();
  }

  toggle(): void {
    this.openState ? this.close() : this.open('api');
  }

  // ----- navigation -----

  private get current(): View {
    return this.stack[this.stack.length - 1] as View;
  }

  goHome(): void {
    this.stack = [{ kind: 'home' }];
    this.render();
    this.emitter.emit('navigate', { view: 'home' });
  }

  goCategory(id: string): void {
    this.push({ kind: 'category', id });
    this.emitter.emit('navigate', { view: 'category', id });
  }

  goArticle(id: string): void {
    this.push({ kind: 'article', id });
    this.emitter.emit('navigate', { view: 'article', id });
  }

  goSearch(query: string): void {
    if (this.current.kind === 'search') {
      (this.current as { query: string }).query = query;
      this.render();
    } else {
      this.push({ kind: 'search', query });
    }
  }

  goBack(): void {
    if (this.stack.length > 1) {
      this.stack.pop();
      this.render();
      const v = this.current;
      this.emitter.emit('navigate', {
        view: v.kind,
        id: 'id' in v ? v.id : undefined,
      });
    }
  }

  private push(view: View): void {
    this.stack.push(view);
    this.render();
  }

  // ----- DOM construction -----

  private buildDom(): void {
    const t = this.opts.texts;

    if (this.opts.launcher) {
      this.launcherBtn = document.createElement('button');
      this.launcherBtn.className = 'hn-launcher';
      this.launcherBtn.setAttribute('aria-label', t.launcherLabel);
      this.launcherBtn.setAttribute('aria-expanded', 'false');
      this.launcherBtn.innerHTML = ICONS.help;
      this.launcherBtn.addEventListener('click', () =>
        this.openState ? this.close() : this.open('launcher'),
      );
      this.root.appendChild(this.launcherBtn);
    }

    this.panel = document.createElement('section');
    this.panel.className = 'hn-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', t.panelTitle);
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.setAttribute('inert', '');
    this.panel.innerHTML = `
      <header class="hn-header">
        <div class="hn-header-row">
          <button class="hn-icon-btn hn-back" aria-label="${escapeHtml(t.backLabel)}" hidden>${ICONS.back}</button>
          <h2 class="hn-title">${escapeHtml(t.panelTitle)}</h2>
          <button class="hn-icon-btn hn-close" aria-label="${escapeHtml(t.closeLabel)}">${ICONS.close}</button>
        </div>
        <div class="hn-search-wrap">
          ${ICONS.search}
          <input class="hn-search" type="search" placeholder="${escapeHtml(t.searchPlaceholder)}" aria-label="${escapeHtml(t.searchPlaceholder)}">
        </div>
      </header>
      <div class="hn-body" tabindex="-1"></div>
      <footer class="hn-footer">
        <span></span>
        <span>${this.opts.hotkey ? escapeHtml(t.hotkeyHint) + ' <kbd>' + escapeHtml(String(this.opts.hotkey)) + '</kbd>' : ''}</span>
      </footer>
    `;
    this.root.appendChild(this.panel);

    this.titleEl = this.panel.querySelector('.hn-title') as HTMLElement;
    this.backBtn = this.panel.querySelector('.hn-back') as HTMLButtonElement;
    this.searchInput = this.panel.querySelector('.hn-search') as HTMLInputElement;
    this.bodyEl = this.panel.querySelector('.hn-body') as HTMLElement;

    (this.panel.querySelector('.hn-close') as HTMLButtonElement).addEventListener('click', () =>
      this.close(),
    );
    this.backBtn.addEventListener('click', () => this.goBack());

    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    this.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = this.searchInput.value.trim();
        if (!q) {
          if (this.current.kind === 'search') this.goBack();
          return;
        }
        this.goSearch(q);
      }, 120);
    });

    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    });

    this.bodyEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-hn-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.getAttribute('data-hn-action');
      const id = btn.getAttribute('data-hn-id') ?? '';
      if (action === 'category') this.goCategory(id);
      else if (action === 'article') this.goArticle(id);
      else if (action === 'feedback') {
        const helpful = btn.getAttribute('data-hn-value') === 'yes';
        this.emitter.emit('feedback', { articleId: id, helpful });
        const box = btn.closest('.hn-feedback');
        if (box) {
          const t = this.opts.texts;
          box.innerHTML = `<span class="hn-thanks">${escapeHtml(t.feedbackThanks)}</span>`;
        }
      }
    });

    this.render();
  }

  private updateLauncher(): void {
    if (!this.launcherBtn) return;
    this.launcherBtn.innerHTML = this.openState ? ICONS.close : ICONS.help;
    this.launcherBtn.setAttribute('aria-expanded', String(this.openState));
  }

  private handleDocKeydown(e: KeyboardEvent): void {
    const hotkey = this.opts.hotkey;
    if (hotkey === false) return;
    if (e.key === hotkey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!this.openState && isEditableTarget(e.target)) return;
      e.preventDefault();
      this.openState ? this.close() : this.open('hotkey');
    }
  }

  private handleAttributeTrigger(e: MouseEvent): void {
    const el = (e.target as HTMLElement).closest?.('[data-help-open]') as HTMLElement | null;
    if (!el) return;
    const id = el.getAttribute('data-help-open');
    if (!id) return;
    e.preventDefault();
    this.stack = [{ kind: 'home' }, { kind: 'article', id }];
    this.render();
    this.open('attribute');
    this.emitter.emit('navigate', { view: 'article', id });
  }

  // ----- rendering -----

  private render(): void {
    const t = this.opts.texts;
    const view = this.current;

    this.backBtn.hidden = this.stack.length <= 1;
    if (view.kind !== 'search' && this.searchInput.value && this.stack.every((v) => v.kind !== 'search')) {
      this.searchInput.value = '';
    }

    if (this.loadFailed) {
      this.titleEl.textContent = t.panelTitle;
      this.bodyEl.innerHTML = `<div class="hn-empty">${ICONS.doc}<div>${escapeHtml(t.loadError)}</div></div>`;
      return;
    }
    if (!this.store || !this.index) {
      this.titleEl.textContent = t.panelTitle;
      this.bodyEl.innerHTML = `<div class="hn-spinner" role="status" aria-label="${escapeHtml(t.loading)}"></div>`;
      return;
    }

    switch (view.kind) {
      case 'home':
        this.titleEl.textContent = t.panelTitle;
        this.bodyEl.innerHTML = this.renderHome();
        break;
      case 'category': {
        const cat = this.store.getCategory(view.id);
        this.titleEl.textContent = cat?.title ?? t.panelTitle;
        this.bodyEl.innerHTML = this.renderCategory(view.id);
        break;
      }
      case 'article': {
        const article = this.store.getArticle(view.id);
        this.titleEl.textContent =
          (article && this.store.categoryOf(article)?.title) || t.panelTitle;
        this.bodyEl.innerHTML = article
          ? this.renderArticle(article)
          : `<div class="hn-empty">${ICONS.doc}<div>${escapeHtml(t.noResults)}</div></div>`;
        break;
      }
      case 'search':
        this.titleEl.textContent = t.resultsTitle;
        this.bodyEl.innerHTML = this.renderSearch(view.query);
        break;
    }
    this.bodyEl.scrollTop = 0;
  }

  private articleItem(a: HelpArticle, sub?: string): string {
    const summary = sub ?? stripMarkdown(a.body).slice(0, 110);
    return `
      <button class="hn-item" data-hn-action="article" data-hn-id="${escapeHtml(a.id)}">
        <div class="hn-item-main">
          <div class="hn-item-title">${escapeHtml(a.title)}</div>
          <div class="hn-item-sub">${escapeHtml(summary)}</div>
        </div>
        ${ICONS.chevron}
      </button>`;
  }

  private renderHome(): string {
    const t = this.opts.texts;
    const store = this.store!;
    const parts: string[] = [];

    const contextArticles = this.contextIds
      .map((id) => store.getArticle(id))
      .filter((a): a is HelpArticle => !!a);
    if (contextArticles.length) {
      parts.push(`<div class="hn-section-title">${escapeHtml(t.suggestedTitle)}</div>`);
      parts.push(...contextArticles.map((a) => this.articleItem(a)));
    }

    const featured = store.featured().filter((a) => !this.contextIds.includes(a.id));
    if (featured.length) {
      parts.push(`<div class="hn-section-title">${escapeHtml(t.featuredTitle)}</div>`);
      parts.push(...featured.map((a) => this.articleItem(a)));
    }

    parts.push(`<div class="hn-section-title">${escapeHtml(t.categoriesTitle)}</div>`);
    for (const cat of store.categories) {
      const count = store.articlesIn(cat.id).length;
      parts.push(`
        <button class="hn-item" data-hn-action="category" data-hn-id="${escapeHtml(cat.id)}">
          <div class="hn-item-icon" aria-hidden="true">${escapeHtml(cat.icon ?? '📄')}</div>
          <div class="hn-item-main">
            <div class="hn-item-title">${escapeHtml(cat.title)}</div>
            ${cat.description ? `<div class="hn-item-sub">${escapeHtml(cat.description)}</div>` : ''}
          </div>
          <span class="hn-item-count">${escapeHtml(t.articleCount(count))}</span>
          ${ICONS.chevron}
        </button>`);
    }
    return parts.join('');
  }

  private renderCategory(id: string): string {
    const store = this.store!;
    const cat = store.getCategory(id);
    const articles = store.articlesIn(id);
    const parts: string[] = [];
    if (cat?.description) {
      parts.push(`<p class="hn-crumb">${escapeHtml(cat.description)}</p>`);
    }
    parts.push(...articles.map((a) => this.articleItem(a)));
    return parts.join('');
  }

  private renderArticle(a: HelpArticle): string {
    const t = this.opts.texts;
    const store = this.store!;
    const parts: string[] = [];
    const cat = store.categoryOf(a);

    parts.push('<div class="hn-article">');
    if (cat) parts.push(`<div class="hn-crumb">${escapeHtml(cat.title)}</div>`);
    parts.push(`<h1>${escapeHtml(a.title)}</h1>`);
    if (a.updatedAt) {
      parts.push(`<div class="hn-meta">${escapeHtml(t.updatedLabel)} ${escapeHtml(a.updatedAt.slice(0, 10))}</div>`);
    }
    parts.push(renderMarkdown(a.body));
    if (a.tags?.length) {
      parts.push(
        `<div class="hn-tags">${a.tags.map((tag) => `<span class="hn-tag">${escapeHtml(tag)}</span>`).join('')}</div>`,
      );
    }
    parts.push('</div>');

    parts.push(`
      <div class="hn-feedback">
        <span>${escapeHtml(t.feedbackPrompt)}</span>
        <div class="hn-feedback-btns">
          <button data-hn-action="feedback" data-hn-id="${escapeHtml(a.id)}" data-hn-value="yes">${escapeHtml(t.feedbackYes)}</button>
          <button data-hn-action="feedback" data-hn-id="${escapeHtml(a.id)}" data-hn-value="no">${escapeHtml(t.feedbackNo)}</button>
        </div>
      </div>`);

    const { prev, next } = store.siblings(a);
    if (prev || next) {
      parts.push('<div class="hn-pager">');
      parts.push(
        prev
          ? `<button data-hn-action="article" data-hn-id="${escapeHtml(prev.id)}"><small>${escapeHtml(t.prevLabel)}</small><span>${escapeHtml(prev.title)}</span></button>`
          : '<span style="flex:1"></span>',
      );
      parts.push(
        next
          ? `<button class="hn-next" data-hn-action="article" data-hn-id="${escapeHtml(next.id)}"><small>${escapeHtml(t.nextLabel)}</small><span>${escapeHtml(next.title)}</span></button>`
          : '<span style="flex:1"></span>',
      );
      parts.push('</div>');
    }

    const related = store.related(a);
    if (related.length) {
      parts.push(`<div class="hn-section-title">${escapeHtml(t.relatedTitle)}</div>`);
      parts.push(...related.map((r) => this.articleItem(r)));
    }

    return parts.join('');
  }

  private renderSearch(query: string): string {
    const t = this.opts.texts;
    const results = this.index!.search(query);
    this.emitter.emit('search', { query, results: results.length });

    if (!results.length) {
      return `<div class="hn-empty">${ICONS.search}<div>${escapeHtml(t.noResults)}</div></div>`;
    }
    return results
      .map(
        (r) => `
      <button class="hn-item" data-hn-action="article" data-hn-id="${escapeHtml(r.id)}">
        <div class="hn-item-main">
          <div class="hn-item-title">${r.titleHtml}${r.categoryTitle ? ` <span class="hn-item-count">· ${escapeHtml(r.categoryTitle)}</span>` : ''}</div>
          <div class="hn-item-sub">${r.snippetHtml}</div>
        </div>
        ${ICONS.chevron}
      </button>`,
      )
      .join('');
  }
}
