import { Text } from '@astryxdesign/core/Text';
import type { ReactNode } from 'react';
import styles from './detail.module.css';

/** 상세의 속성 묶음(넓을 때 오른쪽 열의 이름 아래). */
export type DetailSection = { title: string; items: ReactNode };

/**
 * 본문이 있는 대상의 상세. 읽기 열(최대 45rem)에 소속·제목·본문·이어지는 것(하위 항목·활동)을 두고, 속성은 넓으면
 * 오른쪽 16rem 열에 묶음 이름과 함께(스크롤해도 보인다), 좁으면 제목과 본문 사이의 줄바꿈되는 알약 한 줄로 둔다.
 * 같은 속성 요소가 자리만 옮기므로 값·초점·상태를 한 벌만 관리한다. 폭은 창이 아니라 이 영역의 컨테이너 폭으로 판단해
 * 대화상자·패널에서도 맞게 바뀐다. 긴 제목·URL이 가로로 넘치지 않는다.
 */
export function DetailLayout({ label, head, title, sections, children }: {
  label: string; head?: ReactNode; title: ReactNode; sections: DetailSection[]; children: ReactNode;
}) {
  return <section className={styles.detail} aria-label={label}>
    <article className={styles.grid}>
      {head ? <header className={styles.head}>{head}</header> : null}
      <header className={styles.title}>{title}</header>
      {sections.length ? <aside className={styles.side} aria-label="속성">
        {sections.map(section => <section key={section.title} className={styles.section} aria-label={section.title}>
          <Text className={styles.sectionTitle} type="supporting" weight="medium" color="secondary">{section.title}</Text>
          {section.items}
        </section>)}
      </aside> : null}
      <section className={styles.body} aria-label="본문">{children}</section>
    </article>
  </section>;
}
