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
  const width = useResizable({
    defaultSize: 400,
    minSizePx: 288,
    maxSizePx: 560
  });
  if (phone) return list;
  return <div className={styles.inbox}><section className={styles.list} aria-label="알림 목록" style={{
      width: width.size
    }}>{list}</section><ResizeHandle label="알림 목록 너비" resizable={width.props} hasDivider /><section className={styles.detail} aria-label="알림 내용">{detail}</section></div>;
}
