import type { AnyRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BootCover as KitBootCover } from '@/shared/ui/kit/boot-cover';
import { LoadingMark } from '@/shared/ui/page-loading/LoadingMark';

/**
 * 첫 방문 덮개. index.html의 덮개(vite.config의 initialCover, public/boot.js)를 같은 그림 · 같은 문구로 이어받아, 첫 경로의
 * 데이터가 준비되면 걷는다. 이후 화면 전환에는 다시 띄우지 않는다(RouteStage의 진행 표시가 맡는다).
 * 로켓은 로티(LoadingMark)로 움직인다: 플레이어가 오기 전에는 index.html과 같은 정지 프레임이고, 오면 그 자리에서 돌기 시작한다.
 * 덮개가 걷히는 동안에도 계속 움직이다 다 사라진 뒤 멈춘다(2026-11-14, shadcn 이관 때 정지 그림만 남았던 것을 되돌림).
 */
export function BootCover({ router }: { router: AnyRouter }) {
  const [isReady, setReady] = useState(false);
  useEffect(() => {
    const ready = () => setReady(true);
    const off = router.subscribe('onResolved', ready);
    if (router.state.status === 'idle' && router.state.matches.length > 0) ready();
    return off;
  }, [router]);
  return <KitBootCover isReady={isReady} mark={<LoadingMark isPlaying={!isReady} />} />;
}
