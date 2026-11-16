/** 꽃가루 색: 키트의 강조색과 차트 색(라이트 · 다크 토큰). */
const colors = ['--primary', '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map(name => `var(${name})`);

const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 끝낸 순간의 짧은 축하: origin 가운데에서 색 조각이 위로 퍼졌다가 떨어지며 사라진다. 움직임 줄이기를 켰으면 하지 않는다.
 * 조각은 화면 맨 위 층(popover)에 그려 대화상자 위에서도 보이고, 누르기를 막지 않는다. 돌려준 함수로 바로 걷을 수 있다.
 */
export function celebrate(origin: Element | null, count = 44): () => void {
  if (!origin || reducedMotion() || typeof HTMLElement.prototype.animate !== 'function') return () => {};
  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed', inset: '0', width: '100vw', height: '100dvh', margin: '0', padding: '0', border: '0',
    background: 'transparent', overflow: 'hidden', pointerEvents: 'none', zIndex: '2147483647',
  });
  document.body.append(layer);
  if (typeof layer.showPopover === 'function') {
    layer.popover = 'manual';
    layer.showPopover();
  }
  const animations: Animation[] = [];
  for (let index = 0; index < count; index++) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 6;
    Object.assign(piece.style, {
      position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size * 0.45}px`,
      marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`, background: colors[index % colors.length],
      borderRadius: index % 3 === 0 ? '50%' : '2px',
    });
    layer.append(piece);
    // 위로 부채꼴로 퍼지며 느려졌다가 떨어지며 흐려진다.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 140 + Math.random() * 180;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 900;
    animations.push(piece.animate([
      { transform: 'translate(0, 0) rotate(0deg) scale(0.6)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.45, easing: 'ease-in' },
      { transform: `translate(${dx * 1.25}px, ${dy + 260}px) rotate(${spin}deg) scale(0.9)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(0.15, 0.7, 0.3, 1)', fill: 'forwards' }));
  }
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    animations.forEach(animation => animation.cancel());
    layer.remove();
  };
  void Promise.allSettled(animations.map(animation => animation.finished)).then(remove);
  return remove;
}
