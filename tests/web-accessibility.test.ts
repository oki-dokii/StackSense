// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { App } from '../apps/web/src/main';
import { recommend } from '../packages/engine/src/index';
const schema = JSON.parse(
  readFileSync(`${process.cwd()}/schemas/scenario.schema.json`, 'utf8'),
);
const sample = JSON.parse(
  readFileSync(`${process.cwd()}/fixtures/public/P1.json`, 'utf8'),
);
let root: Root;
const button = (name: string) =>
  [...document.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === name,
  )!;
async function click(el: HTMLElement) {
  await act(async () => {
    el.focus();
    el.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}
beforeEach(async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  history.replaceState({}, '', '/');
  document.body.innerHTML = '<div id="test-host"></div>';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === '/api/methodology'
          ? {
              schema,
              sources: [],
              notes: [],
              engine_version: 'test',
              catalog_version: 'test',
              services_version: 'test',
            }
          : url === '/api/samples'
            ? [sample]
            : recommend({ ...sample, team: { ...sample.team, size: 0 } }),
    })),
  );
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  );
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  root = createRoot(document.getElementById('test-host')!);
  await act(async () => {
    root.render(createElement(App));
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
describe('workspace focus behavior', () => {
  it('does not steal initial focus, and names the active route', () => {
    expect(document.activeElement).toBe(document.body);
    expect(document.title).toBe('Workspace — StackSense');
    expect(document.querySelector('.skip')?.getAttribute('href')).toBe('#main');
  });
  it('focuses route heading and updates title on navigation and browser back', async () => {
    await click(button('Methodology'));
    expect(document.activeElement?.tagName).toBe('H1');
    expect(document.activeElement?.textContent).toBe(
      'Decisions you can inspect.',
    );
    expect(document.title).toBe('Methodology — StackSense');
    await act(async () => {
      history.replaceState({}, '', '/');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(document.title).toBe('Workspace — StackSense');
    expect(document.activeElement?.tagName).toBe('H1');
  });
  it('moves focus to a requested section after switching routes', async () => {
    await click(button('Methodology'));
    await click(button('04Budget'));
    expect(document.activeElement?.id).toBe('section-budget');
    expect(document.title).toBe('Workspace — StackSense');
  });
  it('scrolls only after the requested page has committed', async () => {
    const headingsAtScroll: string[] = [];
    vi.mocked(window.scrollTo).mockImplementation(() => {
      headingsAtScroll.push(document.querySelector('main h1')?.textContent ?? '');
    });
    await click(button('Methodology'));
    expect(headingsAtScroll).toEqual(['Decisions you can inspect.']);
    headingsAtScroll.length = 0;
    await click(button('Workspace'));
    expect(headingsAtScroll).toEqual(['Choose your stack.Know the trade-offs.']);
  });
  it('opens a workspace section without first scrolling to the landing area', async () => {
    await click(button('Methodology'));
    vi.mocked(window.scrollTo).mockClear();
    await click(button('04Budget'));
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('section-budget');
  });
  it('opens the JSON editor with focus and returns focus when cancelled', async () => {
    const trigger = button('↥ Import / edit JSON');
    await click(trigger);
    expect(trigger.getAttribute('aria-controls')).toBe('import-panel');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.id).toBe('json-editor');
    await click(button('Cancel import'));
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  it('keeps import parse errors focused in the alert without dismissing the editor', async () => {
    await click(button('↥ Import / edit JSON'));
    const textarea = document.getElementById(
      'json-editor',
    ) as HTMLTextAreaElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )!.set!.call(textarea, '{');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click(button('Replace inputs with this JSON'));
    expect(document.activeElement?.getAttribute('role')).toBe('alert');
    expect(document.getElementById('json-editor')).not.toBeNull();
    await click(button('Cancel import'));
    expect(document.querySelector('[role=alert]')).toBeNull();
    await click(button('Methodology'));
    expect(document.body.textContent).not.toContain('Invalid JSON');
  });
  it('prioritizes invalid-result summary and lets its error link focus the field', async () => {
    await click(
      [...document.querySelectorAll('button')].find(
        (el) => el.textContent?.trim() === 'Recommend stack →',
      )!,
    );
    expect(document.activeElement?.id).toBe('validation-errors');
    await click(button('team.size'));
    expect(document.activeElement?.id).toBe('team.size');
    expect(document.title).toBe('Workspace — StackSense');
  });
});
