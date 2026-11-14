// Read-only DOM audit. Run in a real browser through the supported CUA API.
// It deliberately has no imports, network calls, DOM writes or application hooks.
export function auditDocument() {
  const visible = (el) =>
    el.getClientRects().length > 0 &&
    !el.closest('[hidden], .sr-only, [aria-hidden="true"]') &&
    getComputedStyle(el).visibility === 'visible';
  const rgb = (value) => {
    const values = value.match(/[\d.]+/g)?.map(Number);
    return values && values.length >= 3
      ? [values[0], values[1], values[2], values[3] ?? 1]
      : null;
  };
  const luminance = (color) =>
    color
      .slice(0, 3)
      .map((n) => {
        const s = n / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);
  const blend = (a, b) =>
    a.slice(0, 3).map((n, i) => n * a[3] + b[i] * (1 - a[3]));
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id,
    class: typeof el.className === 'string' ? el.className : '',
    text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 90),
  });
  const contrast = [],
    unmeasured = [],
    seen = new Set();
  let testedTextElements = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (
      !el.textContent?.trim() ||
      el.children.length ||
      seen.has(el) ||
      !visible(el) ||
      el.closest('script,style,option,svg,button:disabled')
    )
      continue;
    seen.add(el);
    const style = getComputedStyle(el);
    let ancestor = el,
      layers = [],
      unsupported = false;
    while (ancestor) {
      const s = getComputedStyle(ancestor),
        color = rgb(s.backgroundColor);
      if (Number(s.opacity) !== 1 || s.backgroundImage !== 'none') {
        unsupported = true;
        break;
      }
      if (color) {
        layers.push(color);
        if (color[3] === 1) break;
      }
      ancestor = ancestor.parentElement;
    }
    const color = rgb(style.color);
    if (unsupported || !color) {
      unmeasured.push(describe(el));
      continue;
    }
    let background = [255, 255, 255];
    for (const layer of layers.reverse()) background = blend(layer, background);
    const foreground = blend(color, background);
    const threshold =
      Number(style.fontSize.replace('px', '')) >= 24 ||
      (Number(style.fontSize.replace('px', '')) >= 18.6667 &&
        Number(style.fontWeight) >= 700)
        ? 3
        : 4.5;
    const actual = ratio(foreground, background);
    testedTextElements++;
    if (actual < threshold)
      contrast.push({
        ...describe(el),
        foreground: style.color,
        background: background.map((n) => Math.round(n)),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        ratio: actual,
        required: threshold,
      });
  }
  const controls = [
    ...document.querySelectorAll(
      'input:not([type="hidden"]),select,textarea,button,a[href]',
    ),
  ].filter(visible);
  const unnamedControls = controls
    .filter(
      (el) =>
        !el.getAttribute('aria-label')?.trim() &&
        !el
          .getAttribute('aria-labelledby')
          ?.split(/\s+/)
          .some((id) => document.getElementById(id)?.textContent.trim()) &&
        !(el.labels && [...el.labels].some((l) => l.textContent.trim())) &&
        !el.textContent.trim() &&
        !['submit', 'button'].includes(el.getAttribute('type')),
    )
    .map(describe);
  const missingDescriptions = [
    ...document.querySelectorAll('[aria-describedby],[aria-labelledby]'),
  ]
    .filter(visible)
    .flatMap((el) =>
      ['aria-describedby', 'aria-labelledby'].flatMap((attr) =>
        (el.getAttribute(attr)?.split(/\s+/) ?? [])
          .filter((id) => id && !document.getElementById(id))
          .map((id) => ({ ...describe(el), attribute: attr, missing: id })),
      ),
    );
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  return {
    path: location.pathname,
    title: document.title,
    viewport: {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      documentWidth: document.documentElement.scrollWidth,
    },
    activeElement: describe(document.activeElement),
    landmarks: {
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
    },
    testedTextElements,
    unmeasuredTextElements: unmeasured.length,
    limitations:
      'Custom read-only snapshot, not axe or WCAG conformance. Solid-background text only; skips SVG, opacity/gradient cases, disabled and hidden text. Does not test assistive technology, focus obscuring, control borders or all accessible-name rules.',
    issues: {
      contrast,
      unnamedControls,
      missingDescriptions,
      duplicateIds: duplicates,
    },
    unmeasured,
  };
}
