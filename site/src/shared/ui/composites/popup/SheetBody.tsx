import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

/**
 * 바텀시트의 내용 영역. 좌우 12px, 아래 20px. 손잡이 자리(위 24px)는 Astryx 시트가 `padding`과 상관없이 직접 두므로 여기서 더하지 않는다.
 * 시트를 쓰는 모든 조합이 같은 여백을 쓰도록 한 곳에 둔다.
 */
export function SheetBody({ children, gap }: { children: ReactNode; gap?: 0 | 1 | 2 | 3 | 4 }) {
  return <VStack paddingInline={3} paddingBlockEnd={5} gap={gap}>{children}</VStack>;
}
