import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

/**
 * 바텀시트의 내용 영역. Astryx는 손잡이를 시트 위 24px에 겹쳐 그리므로 내용은 그 아래에서 시작한다. 좌우 12px, 아래 20px.
 * 시트를 쓰는 모든 조합이 같은 여백을 쓰도록 한 곳에 둔다.
 */
export function SheetBody({ children, gap }: { children: ReactNode; gap?: 0 | 1 | 2 | 3 | 4 }) {
  return <VStack paddingInline={3} paddingBlockStart={6} paddingBlockEnd={5} gap={gap}>{children}</VStack>;
}
