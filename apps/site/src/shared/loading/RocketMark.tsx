import { useEffect, useId, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import still from './rocket-still.svg?raw';

/**
 * 불러오는 중 그림: 선으로 그린 로켓(Rocket in Space, Steven Monson after Ilya Pavlov, LottieFiles, Lottie Simple License,
 * LICENSE-rocket.txt). 재생기가 오기 전에는 첫 장면을 미리 그린 SVG로 보여 처음부터 로켓이 있고, 재생기가 오면 그 자리에서
 * 움직이기 시작한다. 동작 줄이기면 첫 장면에 멈춘다.
 * 그림은 키트 덮개의 약속 색으로 그려져 있다: 선 · 점 rgb(0,0,0)은 글자색(덮개의 보조 잉크), 면 rgb(254,254,255)는 올린 면(--card).
 * 재생기가 그리는 SVG도 같은 속성 값을 쓰므로 속성 선택자로 칠한다(index.html에 미리 넣은 덮개와 같은 규칙).
 */
const drawing = () => Promise.all([import('lottie-web/build/player/lottie_light'), import('./rocket-loader.json')])
  .then(([player, data]) => ({ player: player.default, data: data.default }));

const FRAME = 'absolute inset-0 block [&_svg]:block [&_svg]:size-full';
const TINT = '[&_[stroke="rgb(0,0,0)"]]:stroke-current [&_[fill="rgb(0,0,0)"]]:fill-current [&_[fill="rgb(254,254,255)"]]:fill-card';

export function RocketMark() {
  const box = useRef<HTMLSpanElement>(null);
  const [animation, setAnimation] = useState<AnimationItem | null>(null);
  // 그림 안의 clipPath 이름이 겹치지 않게 그림마다 접두사를 바꾼다.
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, '') + '-';
  useEffect(() => {
    let item: AnimationItem | undefined; let isGone = false;
    void drawing().then(({ player, data }) => {
      if (isGone || !box.current) return;
      item = player.loadAnimation({ container: box.current, renderer: 'svg', loop: true, autoplay: false, animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) item.goToAndStop(0, true); else item.play();
      setAnimation(item);
    });
    return () => { isGone = true; item?.destroy(); };
  }, []);
  // 미리 그린 첫 장면과 재생기의 그림이 같은 정사각 자리에 겹쳐, 하나가 다른 하나를 제자리에서 바꾼다.
  return <span className={`relative block size-full ${TINT}`}>
    {animation ? null : <span className={FRAME} dangerouslySetInnerHTML={{ __html: still.replaceAll('rocket-still-', prefix) }} />}
    <span ref={box} className={FRAME} />
  </span>;
}
