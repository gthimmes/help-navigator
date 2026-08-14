/**
 * All widget styles, injected into the shadow root. Theming is driven by
 * CSS custom properties: hosts can override any `--hn-*` variable on the
 * `help-navigator-root` element from outside the shadow boundary.
 */
export const STYLES = `
:host {
  --hn-accent: #4f46e5;
  --hn-accent-fg: #ffffff;
  --hn-bg: #ffffff;
  --hn-bg-soft: #f6f7f9;
  --hn-fg: #16181d;
  --hn-muted: #6b7280;
  --hn-border: #e4e6eb;
  --hn-mark: #fde68a;
  --hn-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  --hn-radius: 14px;
  --hn-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --hn-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, monospace;
  --hn-width: 400px;
  --hn-z: 2147482000;
  all: initial;
  font-family: var(--hn-font);
}

:host([data-hn-theme="dark"]) { ${darkVars()} }
@media (prefers-color-scheme: dark) {
  :host([data-hn-theme="auto"]) { ${darkVars()} }
}

*, *::before, *::after { box-sizing: border-box; }

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
button:focus-visible, a:focus-visible, input:focus-visible {
  outline: 2px solid var(--hn-accent);
  outline-offset: 2px;
}

/* ---------- Launcher ---------- */
.hn-launcher {
  position: fixed;
  bottom: 24px;
  z-index: var(--hn-z);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--hn-accent);
  color: var(--hn-accent-fg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.hn-launcher:hover { transform: scale(1.07); box-shadow: 0 8px 26px rgba(0, 0, 0, 0.3); }
.hn-launcher:active { transform: scale(0.97); }
.hn-launcher svg { width: 24px; height: 24px; }
.hn-pos-right .hn-launcher { right: 24px; }
.hn-pos-left .hn-launcher { left: 24px; }

/* ---------- Panel ---------- */
.hn-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: var(--hn-z);
  width: min(var(--hn-width), 100vw);
  background: var(--hn-bg);
  color: var(--hn-fg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--hn-shadow);
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  font-size: 14.5px;
  line-height: 1.55;
}
.hn-pos-right .hn-panel { right: 0; transform: translateX(calc(100% + 40px)); border-radius: var(--hn-radius) 0 0 var(--hn-radius); }
.hn-pos-left .hn-panel { left: 0; transform: translateX(calc(-100% - 40px)); border-radius: 0 var(--hn-radius) var(--hn-radius) 0; }
.hn-open .hn-panel { transform: translateX(0); }
@media (prefers-reduced-motion: reduce) {
  .hn-panel, .hn-launcher { transition: none; }
}

.hn-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--hn-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}
.hn-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}
.hn-title {
  font-size: 16px;
  font-weight: 650;
  flex: 1;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hn-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hn-muted);
  flex-shrink: 0;
}
.hn-icon-btn:hover { background: var(--hn-bg-soft); color: var(--hn-fg); }
.hn-icon-btn svg { width: 18px; height: 18px; }
.hn-icon-btn[hidden] { display: none; }

.hn-search-wrap { position: relative; }
.hn-search-wrap svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--hn-muted);
  pointer-events: none;
}
.hn-search {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 10px;
  border: 1px solid var(--hn-border);
  background: var(--hn-bg-soft);
  color: var(--hn-fg);
  font: inherit;
}
.hn-search::placeholder { color: var(--hn-muted); }
.hn-search:focus { border-color: var(--hn-accent); outline: none; background: var(--hn-bg); }

.hn-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 18px;
}
.hn-body::-webkit-scrollbar { width: 8px; }
.hn-body::-webkit-scrollbar-thumb { background: var(--hn-border); border-radius: 4px; }

.hn-footer {
  padding: 8px 18px;
  border-top: 1px solid var(--hn-border);
  color: var(--hn-muted);
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.hn-footer kbd {
  font-family: var(--hn-mono);
  font-size: 11px;
  background: var(--hn-bg-soft);
  border: 1px solid var(--hn-border);
  border-radius: 4px;
  padding: 1px 5px;
}

/* ---------- Shared list items ---------- */
.hn-section-title {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--hn-muted);
  margin: 18px 0 8px;
}
.hn-section-title:first-child { margin-top: 0; }

.hn-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  margin: 0 -2px;
}
.hn-item:hover, .hn-item.hn-active { background: var(--hn-bg-soft); }
.hn-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--hn-accent) 12%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}
.hn-item-main { flex: 1; min-width: 0; }
.hn-item-title { font-weight: 550; }
.hn-item-sub {
  color: var(--hn-muted);
  font-size: 12.5px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.hn-item-count { color: var(--hn-muted); font-size: 12px; flex-shrink: 0; }
.hn-chevron { width: 16px; height: 16px; color: var(--hn-muted); flex-shrink: 0; }

mark { background: var(--hn-mark); color: inherit; border-radius: 2px; padding: 0 1px; }

.hn-empty {
  text-align: center;
  color: var(--hn-muted);
  padding: 40px 20px;
}
.hn-empty svg { width: 36px; height: 36px; margin-bottom: 10px; opacity: 0.5; }

/* ---------- Article view ---------- */
.hn-crumb {
  font-size: 12.5px;
  color: var(--hn-muted);
  margin-bottom: 4px;
}
.hn-article h1 { font-size: 20px; margin: 0 0 12px; line-height: 1.3; }
.hn-article h2 { font-size: 16px; margin: 20px 0 8px; }
.hn-article h3, .hn-article h4 { font-size: 14.5px; margin: 16px 0 6px; }
.hn-article p { margin: 0 0 12px; }
.hn-article a { color: var(--hn-accent); }
.hn-article ul, .hn-article ol { margin: 0 0 12px; padding-left: 22px; }
.hn-article li { margin: 4px 0; }
.hn-article code {
  font-family: var(--hn-mono);
  font-size: 0.9em;
  background: var(--hn-bg-soft);
  border: 1px solid var(--hn-border);
  border-radius: 5px;
  padding: 1px 5px;
}
.hn-article pre {
  background: var(--hn-bg-soft);
  border: 1px solid var(--hn-border);
  border-radius: 10px;
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0 0 12px;
}
.hn-article pre code { background: none; border: none; padding: 0; font-size: 12.5px; }
.hn-article blockquote {
  border-left: 3px solid var(--hn-accent);
  margin: 0 0 12px;
  padding: 2px 0 2px 14px;
  color: var(--hn-muted);
}
.hn-article blockquote p { margin: 0; }
.hn-article img { max-width: 100%; border-radius: 10px; }
.hn-article hr { border: none; border-top: 1px solid var(--hn-border); margin: 18px 0; }

.hn-meta { color: var(--hn-muted); font-size: 12px; margin-bottom: 14px; }
.hn-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0; }
.hn-tag {
  font-size: 11.5px;
  color: var(--hn-muted);
  background: var(--hn-bg-soft);
  border: 1px solid var(--hn-border);
  border-radius: 999px;
  padding: 2px 9px;
}

.hn-feedback {
  margin-top: 20px;
  padding: 14px;
  border: 1px solid var(--hn-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}
.hn-feedback-btns { display: flex; gap: 6px; }
.hn-feedback button {
  border: 1px solid var(--hn-border);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 13px;
}
.hn-feedback button:hover { border-color: var(--hn-accent); color: var(--hn-accent); }
.hn-feedback .hn-thanks { color: var(--hn-accent); font-weight: 550; }

.hn-pager {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
}
.hn-pager button {
  flex: 1;
  border: 1px solid var(--hn-border);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  min-width: 0;
}
.hn-pager button:hover { border-color: var(--hn-accent); }
.hn-pager .hn-next { text-align: right; }
.hn-pager small { display: block; color: var(--hn-muted); font-size: 11px; }
.hn-pager span {
  display: block;
  font-weight: 550;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hn-spinner {
  margin: 60px auto;
  width: 28px;
  height: 28px;
  border: 3px solid var(--hn-border);
  border-top-color: var(--hn-accent);
  border-radius: 50%;
  animation: hn-spin 0.8s linear infinite;
}
@keyframes hn-spin { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .hn-panel { width: 100vw; border-radius: 0 !important; }
}
`;

function darkVars(): string {
  return `
  --hn-bg: #1b1d23;
  --hn-bg-soft: #262932;
  --hn-fg: #e8eaf0;
  --hn-muted: #9aa1af;
  --hn-border: #333743;
  --hn-mark: #6d5710;
  --hn-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  `;
}
