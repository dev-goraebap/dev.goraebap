import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { createContext, useContext, useId, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styles from './compose.module.css';

/** 휴대폰 작성 화면이 속성 알약을 둘 자리: 바닥 동작 위의 고정 줄. 다른 곳에서는 null(본문 아래). */
export const ComposePillsContext = createContext<HTMLElement | null>(null);

/**
 * 제목과 본문이 있는 것을 쓰는 종이: 테두리 없는 제목과 본문, 그 아래 속성 알약, 필요할 때만 안내. 대화상자와 페이지가
 * 같은 양식을 쓰며 페이지는 본문에 더 많은 자리를 준다. 본문 칸은 프로젝트 에디터를 받는다(서식 도구 막대를 덧붙이지 않는다).
 */
export function ComposeForm({ title, onTitle, titlePlaceholder = '제목', titleError, body, pills, pillsError, note, titleRef, isPage = false }: {
  title: string; onTitle: (title: string) => void; titlePlaceholder?: string;
  /** 제출 검사에서 제목이 빠졌을 때 제목 곁에 보일 설명. */
  titleError?: string;
  body?: ReactNode; pills?: ReactNode;
  /** 필수 속성이 빠졌을 때 알약 줄 곁에 보일 설명. 빠진 알약에는 isInvalid를 준다. */
  pillsError?: string;
  note?: ReactNode; titleRef?: RefObject<HTMLInputElement | null>; isPage?: boolean;
}) {
  const titleErrorId = useId();
  return <VStack gap={3} className={styles.form} data-page={isPage || undefined}>
    <VStack gap={1}>
      <input ref={titleRef} className={styles.title} value={title} placeholder={titlePlaceholder} aria-label="제목" autoFocus data-autofocus
        aria-invalid={titleError ? true : undefined} aria-describedby={titleError ? titleErrorId : undefined}
        onChange={event => onTitle(event.target.value)} />
      {titleError ? <Text id={titleErrorId} className={styles.error} type="supporting">{titleError}</Text> : null}
    </VStack>
    {body ? <VStack className={styles.body}>{body}</VStack> : null}
    {pills ? <Pills error={pillsError}>{pills}</Pills> : null}
    {note}
  </VStack>;
}

/**
 * 제목을 따로 쓰지 않는 양식(이름이 정해진 보고 등): 제목 자리에 그 이름, 이름 붙은 부분들, 알약.
 */
export function PaperForm({ heading, about, parts, pills, isPage = false }: {
  heading: string; about?: ReactNode; parts: { label: string; content: ReactNode }[]; pills?: ReactNode; isPage?: boolean;
}) {
  return <VStack gap={4} className={styles.form} data-page={isPage || undefined}>
    <VStack gap={1}><h1 className={styles.heading}>{heading}</h1>{about}</VStack>
    {parts.map(part => <VStack key={part.label} gap={1} as="section" aria-label={part.label}>
      <span className={styles.partLabel}>{part.label}</span>
      {part.content}
    </VStack>)}
    {pills ? <Pills>{pills}</Pills> : null}
  </VStack>;
}

function Pills({ error, children }: { error?: string; children: ReactNode }) {
  const slot = useContext(ComposePillsContext);
  const row = <VStack gap={1}>
    <HStack className={styles.pills} gap={1.5} wrap="wrap" vAlign="center" role="group" aria-label="속성">{children}</HStack>
    {error ? <Text className={styles.error} type="supporting" role="alert">{error}</Text> : null}
  </VStack>;
  return slot ? createPortal(row, slot) : row;
}
