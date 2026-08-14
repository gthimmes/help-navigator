/** A category groups articles in the navigator's home view. */
export interface HelpCategory {
  id: string;
  title: string;
  description?: string;
  /** Single emoji or short string rendered as the category icon. */
  icon?: string;
}

/** One help article. `body` is markdown (safe subset, HTML is escaped). */
export interface HelpArticle {
  id: string;
  title: string;
  body: string;
  category?: string;
  tags?: string[];
  /** Ids of related articles, shown at the bottom of the article view. */
  related?: string[];
  /** Featured articles surface on the home view. */
  featured?: boolean;
  /** ISO date string, shown as "Updated …" on the article view. */
  updatedAt?: string;
}

export interface HelpContent {
  categories?: HelpCategory[];
  articles: HelpArticle[];
}

export type ThemeMode = 'auto' | 'light' | 'dark';
export type LauncherPosition = 'bottom-right' | 'bottom-left';

/** Every user-facing string, overridable for i18n or tone. */
export interface HelpTexts {
  launcherLabel: string;
  panelTitle: string;
  searchPlaceholder: string;
  suggestedTitle: string;
  featuredTitle: string;
  categoriesTitle: string;
  backLabel: string;
  closeLabel: string;
  noResults: string;
  resultsTitle: string;
  relatedTitle: string;
  feedbackPrompt: string;
  feedbackYes: string;
  feedbackNo: string;
  feedbackThanks: string;
  prevLabel: string;
  nextLabel: string;
  updatedLabel: string;
  loading: string;
  loadError: string;
  articleCount: (n: number) => string;
  hotkeyHint: string;
}

export interface HelpNavigatorOptions {
  /** Inline content object, or a URL to a JSON document of the same shape. */
  content: HelpContent | string;
  position?: LauncherPosition;
  theme?: ThemeMode;
  /** CSS color used for the launcher, links, and highlights. */
  accentColor?: string;
  /** Show the floating launcher button (default true). */
  launcher?: boolean;
  /**
   * Keyboard shortcut that toggles the panel (default 'F1').
   * Single printable characters ('?') or key names ('F1'). false disables.
   */
  hotkey?: string | false;
  zIndex?: number;
  texts?: Partial<HelpTexts>;
  /**
   * Article ids to surface as "Suggested for this page" on the home view.
   * Update at runtime with setContext() as your app's route changes.
   */
  context?: string[];
  /**
   * When true, clicking any element with a `data-help-open="article-id"`
   * attribute anywhere in the document opens that article (default true).
   */
  attributeTriggers?: boolean;
}

export type HelpEventName =
  | 'ready'
  | 'open'
  | 'close'
  | 'navigate'
  | 'search'
  | 'feedback'
  | 'error';

export interface HelpEventPayloads {
  ready: { articles: number };
  open: { via: 'launcher' | 'api' | 'hotkey' | 'attribute' };
  close: Record<string, never>;
  navigate: { view: string; id?: string };
  search: { query: string; results: number };
  feedback: { articleId: string; helpful: boolean };
  error: { message: string };
}
