import type { ReactNode } from 'react';
import { ResizeHandle, useResizable } from '@astryxdesign/core/Resizable';
import { useIsPhone } from '../../foundations/media';
import styles from './inbox-layout.module.css';
export function InboxLayout({
  list,
  detail
}: {
  list: ReactNode;
  detail: ReactNode;
}) {
  const phone = useIsPhone();
  // 조절할 수 있는 옆 목록은 가장 넓게(최대값으로) 연다. 끌어 줄인 너비는 이 화면에 있는 동안 유지된다.
  const width = useResizable({
    defaultSize: 560,
    minSizePx: 288,
    maxSizePx: 560
  });
  if (phone) return list;
  return <div className={styles.inbox}><section className={styles.list} aria-label="알림 목록" style={{
      width: width.size
    }}>{list}</section><ResizeHandle label="알림 목록 너비" resizable={width.props} hasDivider /><section className={styles.detail} aria-label="알림 내용">{detail}</section></div>;
}
