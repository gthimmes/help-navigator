# help-navigator

A framework-agnostic, embeddable in-app help center you can drop into any web app.
Floating launcher → slide-in panel → search, browse, read — the layout and interaction
patterns of best-in-class help widgets (Intercom Messenger, Help Scout Beacon), minus
the vendor, the iframe, and the network calls.

**Zero runtime dependencies. ~29 KB minified (ESM/CJS/IIFE + TypeScript types).**

## Why

Every app needs a help system; almost nobody wants to rebuild the UI for one. This
package gives you a consistent, polished help experience across all your apps — you
supply the content (a plain JSON structure of categories + markdown articles), it
supplies everything else:

- 🎈 **Floating launcher + slide-in panel** — bottom-right or bottom-left, fully keyboard accessible
- 🔍 **Instant client-side search** — title/tag/body ranking, prefix matching for search-as-you-type, highlighted snippets
- 🗂️ **Structured navigation** — home (suggested → featured → categories), category lists, article view with breadcrumb, related articles, prev/next pager
- 📝 **Safe markdown rendering** — headings, lists, code blocks, links, images, blockquotes; all HTML escaped, `javascript:` URLs neutralized
- 🎯 **Contextual help** — `setContext([...])` per route shows "Suggested for this page"; any element with `data-help-open="article-id"` opens that article
- ⌨️ **Hotkey** — `F1` by default (configurable or disableable), `Esc` closes, focus is restored on close
- 🎨 **Themeable** — light/dark/auto plus `--hn-*` CSS custom properties; styles live in a shadow root, so nothing leaks in or out
- 📊 **Analytics-ready events** — `ready`, `open`, `close`, `navigate`, `search`, `feedback`, `error`
- 👍 **Built-in article feedback** — "Was this helpful?" with an event you can pipe anywhere

## Install

```sh
npm install help-navigator
```

## Quick start

```ts
import { HelpNavigator } from 'help-navigator';

const help = HelpNavigator.init({
  content: {
    categories: [
      { id: 'billing', title: 'Billing', icon: '💳', description: 'Invoices and plans.' },
    ],
    articles: [
      {
        id: 'understanding-invoices',
        title: 'Understanding your invoice',
        category: 'billing',
        tags: ['invoice', 'pdf'],
        featured: true,
        body: '## Where to find invoices\n\nGo to *Settings → Billing*…',
      },
    ],
  },
  accentColor: '#4f46e5',
});
```

That's it — a launcher appears bottom-right, `F1` toggles the panel.

`content` can also be a URL to a JSON file of the same shape, fetched lazily:

```ts
HelpNavigator.init({ content: '/help/content.json' });
```

### Script tag / no build step

```html
<script src="https://unpkg.com/help-navigator/dist/index.global.js"></script>
<script>
  HelpNavigatorKit.HelpNavigator.init({ content: '/help.json' });
</script>
```

### As a custom element

```ts
import { defineHelpNavigatorElement } from 'help-navigator';
defineHelpNavigatorElement();
```

```html
<help-navigator src="/help.json" position="bottom-left" theme="dark" accent="#0ea5e9"></help-navigator>
```

## Contextual help

Tell the widget what page the user is on and it surfaces those articles first:

```ts
router.afterEach((route) => {
  help.setContext(routeHelpMap[route.name] ?? []);
});
```

Or annotate the DOM — clicks on these open the article directly, no JS wiring:

```html
<button data-help-open="two-factor">What's this?</button>
```

## API

| Method | Description |
| --- | --- |
| `HelpNavigator.init(options)` | Create and mount the widget |
| `help.open()` / `close()` / `toggle()` | Panel visibility (`help.isOpen` to read) |
| `help.openArticle(id)` | Open the panel on a specific article |
| `help.openCategory(id)` | Open the panel on a category |
| `help.search(query)` | Open the panel showing search results |
| `help.setContext(ids)` | Set "Suggested for this page" articles |
| `help.setContent(content)` | Swap content at runtime (e.g. locale change) |
| `help.on(event, fn)` | Subscribe to events; returns an unsubscribe fn |
| `help.destroy()` | Remove the widget and all listeners |

### Options

| Option | Default | Description |
| --- | --- | --- |
| `content` | — | `HelpContent` object or URL to JSON |
| `position` | `'bottom-right'` | `'bottom-right'` \| `'bottom-left'` |
| `theme` | `'auto'` | `'auto'` \| `'light'` \| `'dark'` |
| `accentColor` | indigo | Any CSS color |
| `launcher` | `true` | Show the floating button |
| `hotkey` | `'F1'` | Key name or single char; `false` disables |
| `zIndex` | very high | Stacking override |
| `context` | `[]` | Initial suggested article ids |
| `attributeTriggers` | `true` | Honor `data-help-open` clicks |
| `texts` | English | Override any UI string (i18n) |

### Events

```ts
help.on('search', ({ query, results }) => analytics.track('help_search', { query, results }));
help.on('feedback', ({ articleId, helpful }) => analytics.track('help_feedback', { articleId, helpful }));
help.on('navigate', ({ view, id }) => { /* 'home' | 'category' | 'article' | 'search' */ });
```

## Theming

The widget renders inside a shadow root under a `<help-navigator-root>` host element.
Override any variable from your app's CSS:

```css
help-navigator-root {
  --hn-accent: #e11d48;
  --hn-radius: 8px;
  --hn-width: 440px;
  --hn-font: 'Inter', sans-serif;
}
```

Available variables: `--hn-accent`, `--hn-accent-fg`, `--hn-bg`, `--hn-bg-soft`,
`--hn-fg`, `--hn-muted`, `--hn-border`, `--hn-mark`, `--hn-shadow`, `--hn-radius`,
`--hn-font`, `--hn-mono`, `--hn-width`, `--hn-z`.

## Demo

```sh
npm install
npm run build
npm run demo   # → http://localhost:4173
```

A fake SaaS dashboard with the widget mounted, buttons exercising the whole API, and
a live event log.

## Development

```sh
npm test        # vitest: markdown, search, store, and jsdom UI tests
npm run build   # tsup → dist/ (esm, cjs, iife, d.ts)
```

See [ROADMAP.md](./ROADMAP.md) for where this is headed.

## License

MIT
