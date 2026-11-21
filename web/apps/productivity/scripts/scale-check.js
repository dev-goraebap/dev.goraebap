/*
 * Whether a screen grows with a large screen's root (DESIGN.md "큰 화면"): paste into the browser console on the page,
 * run `await scaleCheck('a')` at 1600px wide, widen the window to 2560px (the root goes 16px → 19px) and run
 * `await scaleCheck('b')`. It lists what kept its px: heights, type, padding and gaps that did not grow. Astryx's own
 * button icon box (16px) and small chevrons (12px) are known to stay; anything else is a px size to make rem.
 */
window.scaleCheck = async function scaleCheck(phase) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const key = el => { const parts = []; for (let e = el; e && e !== document.body; e = e.parentElement) parts.unshift([...e.parentElement.children].indexOf(e)); return parts.join('.'); };
  const label = el => {
    const names = el.className && el.className.toString ? el.className.toString() : '';
    const astryx = names.split(' ').filter(name => name.startsWith('astryx-')).slice(0, 2).join('.');
    const module = (names.match(/_([a-zA-Z]+)_[a-z0-9]{5}/) || [])[1] || '';
    return `${el.tagName.toLowerCase()}${astryx ? '.' + astryx : ''}${module ? ' [' + module + ']' : ''}`;
  };
  const sizes = {};
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    const style = getComputedStyle(el);
    sizes[key(el)] = { label: label(el), h: box.height, fs: parseFloat(style.fontSize), pi: parseFloat(style.paddingInlineStart), pb: parseFloat(style.paddingBlockStart), gap: parseFloat(style.columnGap) || 0 };
  }
  if (phase === 'a') { sessionStorage.setItem('scale-check', JSON.stringify(sizes)); return `${Object.keys(sizes).length} recorded`; }
  const before = JSON.parse(sessionStorage.getItem('scale-check') || '{}');
  const kept = {}; let measured = 0, grew = 0;
  for (const [k, now] of Object.entries(sizes)) {
    const was = before[k];
    if (!was || was.label !== now.label) continue;
    for (const p of ['h', 'fs', 'pi', 'pb', 'gap']) {
      if ((p === 'h' && now.h > 120) || was[p] < 4) continue; // tall boxes follow the window
      measured++;
      if (Math.abs(now[p] / was[p] - 1) < 0.02) (kept[now.label] ??= new Set()).add(`${p} ${Math.round(was[p])}px`);
      else grew++;
    }
  }
  return { grew: `${grew}/${measured}`, kept: Object.entries(kept).map(([name, what]) => `${name}: ${[...what].join(', ')}`) };
};
