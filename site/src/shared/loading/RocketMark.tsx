import { useEffect, useId, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import still from './rocket-still.svg?raw';
import styles from './rocket.module.css';

/**
 * 불러오는 중 그림: 선으로 그린 로켓(Rocket in Space, Steven Monson after Ilya Pavlov, LottieFiles, Lottie Simple License,
 * LICENSE-rocket.txt). 재생기가 오기 전에는 첫 장면을 미리 그린 SVG로 보여 처음부터 로켓이 있고, 재생기가 오면 그 자리에서
 * 움직이기 시작한다. 동작 줄이기면 첫 장면에 멈춘다. 선과 면은 키트 덮개(.mark)의 규칙대로 테마 색으로 칠해진다.
 */
const drawing = () => Promise.all([import('lottie-web/build/player/lottie_light'), import('./rocket-loader.json')])
  .then(([player, data]) => ({ player: player.default, data: data.default }));

export function RocketMark() {
  const box = useRef<HTMLDivElement>(null);
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
  return <span className={styles.rocket}>
    {animation ? null : <span className={styles.frame} dangerouslySetInnerHTML={{ __html: still.replaceAll('rocket-still-', prefix) }} />}
    <span ref={box} className={styles.frame} />
  </span>;
}
