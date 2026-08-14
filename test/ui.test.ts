// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HelpNavigator } from '../src/index';
import type { HelpContent } from '../src/types';

const content: HelpContent = {
  categories: [{ id: 'basics', title: 'Basics', icon: '📘' }],
  articles: [
    {
      id: 'hello',
      title: 'Hello article',
      body: '# Hi\n\nSome **useful** content about invoices.',
      category: 'basics',
      featured: true,
    },
    { id: 'second', title: 'Second article', body: 'More words here.', category: 'basics' },
  ],
};

function shadow(): ShadowRoot {
  const host = document.querySelector('help-navigator-root');
  expect(host).not.toBeNull();
  return (host as HTMLElement).shadowRoot as ShadowRoot;
}

describe('HelpNavigator UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts a launcher and hidden panel in a shadow root', () => {
    const help = HelpNavigator.init({ content });
    const s = shadow();
    expect(s.querySelector('.hn-launcher')).not.toBeNull();
    const panel = s.querySelector('.hn-panel')!;
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(help.isOpen).toBe(false);
    help.destroy();
    expect(document.querySelector('help-navigator-root')).toBeNull();
  });

  it('keeps view content out of the DOM until opened', () => {
    const help = HelpNavigator.init({ content });
    expect(shadow().querySelector('.hn-body')!.textContent).not.toContain('Basics');
    help.open();
    expect(shadow().querySelector('.hn-body')!.textContent).toContain('Basics');
    help.destroy();
  });

  it('opens, renders home with categories and featured, then closes', () => {
    const help = HelpNavigator.init({ content });
    const events: string[] = [];
    help.on('open', () => events.push('open'));
    help.on('close', () => events.push('close'));

    help.open();
    expect(help.isOpen).toBe(true);
    const s = shadow();
    expect(s.querySelector('.hn-panel')!.hasAttribute('aria-hidden')).toBe(false);
    const body = s.querySelector('.hn-body')!;
    expect(body.textContent).toContain('Popular articles');
    expect(body.textContent).toContain('Hello article');
    expect(body.textContent).toContain('Basics');

    help.close();
    expect(help.isOpen).toBe(false);
    expect(events).toEqual(['open', 'close']);
    help.destroy();
  });

  it('navigates to an article and renders markdown safely', () => {
    const help = HelpNavigator.init({ content });
    help.openArticle('hello');
    const body = shadow().querySelector('.hn-body')!;
    expect(body.querySelector('h1')?.textContent).toBe('Hello article');
    expect(body.innerHTML).toContain('<strong>useful</strong>');
    expect(body.textContent).toContain('Was this article helpful?');
    help.destroy();
  });

  it('search renders highlighted results and emits search event', () => {
    const help = HelpNavigator.init({ content });
    const onSearch = vi.fn();
    help.on('search', onSearch);
    help.search('invoices');
    const body = shadow().querySelector('.hn-body')!;
    expect(body.innerHTML).toContain('<mark>');
    expect(onSearch).toHaveBeenCalledWith({ query: 'invoices', results: 1 });
    help.destroy();
  });

  it('feedback buttons emit and collapse to a thank-you note', () => {
    const help = HelpNavigator.init({ content });
    const onFeedback = vi.fn();
    help.on('feedback', onFeedback);
    help.openArticle('hello');
    const s = shadow();
    const yes = s.querySelector('[data-hn-action="feedback"][data-hn-value="yes"]') as HTMLElement;
    yes.click();
    expect(onFeedback).toHaveBeenCalledWith({ articleId: 'hello', helpful: true });
    expect(s.querySelector('.hn-feedback')!.textContent).toContain('Thanks');
    help.destroy();
  });

  it('clicking a category item drills in and back button returns home', () => {
    const help = HelpNavigator.init({ content });
    help.open();
    const s = shadow();
    const catBtn = s.querySelector('[data-hn-action="category"]') as HTMLElement;
    catBtn.click();
    expect(s.querySelector('.hn-title')!.textContent).toBe('Basics');
    (s.querySelector('.hn-back') as HTMLElement).click();
    expect(s.querySelector('.hn-title')!.textContent).toBe('Help');
    help.destroy();
  });

  it('setContext surfaces suggested articles on home', () => {
    const help = HelpNavigator.init({ content, context: ['second'] });
    help.open();
    const body = shadow().querySelector('.hn-body')!;
    expect(body.textContent).toContain('Suggested for this page');
    expect(body.textContent).toContain('Second article');
    help.destroy();
  });

  it('data-help-open elements in the host page open the article', () => {
    const help = HelpNavigator.init({ content });
    const trigger = document.createElement('button');
    trigger.setAttribute('data-help-open', 'second');
    document.body.appendChild(trigger);
    trigger.click();
    expect(help.isOpen).toBe(true);
    expect(shadow().querySelector('.hn-body')!.textContent).toContain('More words here.');
    help.destroy();
  });

  it('cleans up document listeners on destroy', () => {
    const help = HelpNavigator.init({ content });
    help.destroy();
    const trigger = document.createElement('button');
    trigger.setAttribute('data-help-open', 'second');
    document.body.appendChild(trigger);
    expect(() => trigger.click()).not.toThrow();
    expect(document.querySelector('help-navigator-root')).toBeNull();
  });
});
