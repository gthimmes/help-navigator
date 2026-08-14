# Roadmap

## Design principles

1. **Drop-in** — one `init()` call, no build-step requirements, no framework lock-in.
2. **Self-service first** — search and articles up front (the Help Scout Beacon model);
   escalation channels come later and stay optional.
3. **Zero dependencies, small bundle** — the widget ships inside product apps; every KB counts.
4. **Content as data** — help content is a plain JSON structure that can live in the repo,
   a CMS, or a CDN. The widget never dictates where content comes from.
5. **Safe by default** — markdown is rendered with full HTML escaping and URL
   sanitization; shadow DOM keeps styles from leaking either way.

## v0.1 — Core widget ✅ (shipped)

- Floating launcher + slide-in panel, bottom-right/left, shadow-DOM isolated
- Content model: categories + markdown articles (tags, featured, related, updatedAt)
- Inline content or lazy-fetched JSON URL
- Client-side ranked search with prefix matching and highlighted snippets
- Views: home (suggested/featured/categories), category, article (breadcrumb,
  related, prev/next, feedback), search results
- Contextual help: `setContext()` + `data-help-open` attribute triggers
- Hotkey (F1 default), Esc to close, focus restoration, reduced-motion support
- Theming: light/dark/auto, `--hn-*` CSS variables, accent color option
- Event system for analytics (`open`, `navigate`, `search`, `feedback`, …)
- i18n-ready: every string overridable via `texts`
- Custom element `<help-navigator>` for no-code embedding
- 34 unit/DOM tests; ESM + CJS + IIFE + types builds

## v0.2 — Content pipeline & polish

- [ ] CLI: compile a folder of `.md` files with frontmatter into `help-content.json`
      (so content authors never touch JSON)
- [ ] Content validation with helpful errors (broken `related` ids, missing categories)
- [ ] Deep links: `#help/article-id` URLs open the panel on load; sharable article links
- [ ] Search improvements: typo tolerance (edit distance 1), synonyms map
- [ ] Recently viewed articles on home; per-user persistence via `localStorage`
- [ ] Panel resize + remembered width; full-screen article mode
- [ ] In-article table support and heading anchors / table of contents

## v0.3 — Integrations

- [ ] First-class wrappers: `help-navigator/react`, `help-navigator/vue` (thin, optional)
- [ ] Router adapters for automatic `setContext` (path → article-ids map)
- [ ] Escalation slot: pluggable "Contact us" footer action (mailto, custom handler,
      or your chat widget)
- [ ] Element-anchored beacons: pulse dots on UI elements that open a specific article
- [ ] Feedback aggregation helper + example analytics sinks (GA4, PostHog, Segment)

## v0.4 — Guidance layer

- [ ] Product tours: multi-step anchored walkthroughs driven by the same content file
- [ ] "What's new" changelog view fed by a `changelog` content section
- [ ] Checklists (onboarding progress) with persistence

## v1.0 — Hardening & ecosystem

- [ ] Formal accessibility audit (WCAG 2.2 AA), screen-reader test pass
- [ ] Visual regression test suite; browser matrix CI
- [ ] Versioned/localized content: `content.{locale}.json` convention + locale switcher
- [ ] Docs site with live playground; publish to npm with provenance
- [ ] Optional AI answer layer: a pluggable `answerProvider(query)` hook so apps can
      back search with an LLM over the same content (kept out of core to preserve
      the zero-dependency guarantee)

## Non-goals

- Hosting content, accounts, or any server component
- Live chat/ticketing (we integrate with those; we don't reimplement them)
- A WYSIWYG content editor
