import { createContext, useContext } from 'react';
import type { JSONNode } from '@/shared/lib/rich-document';

/** 본문의 제목 하나: 블록 id(화면의 data-block-id), 단계, 글. */
export type BodyHeading = { id: string; level: number; text: string };

/** 본문(JSON)에 든 제목들을 차례대로 꺼낸다. */
export function headingsOf(body: JSONNode | null | undefined): BodyHeading[] {
  const found: BodyHeading[] = [];
  const text = (node: JSONNode): string => node.text ?? node.content?.map(text).join('') ?? '';
  const walk = (node: JSONNode) => {
    if (node.type === 'heading' && node.attrs?.blockId) found.push({ id: String(node.attrs.blockId), level: Number(node.attrs.level) || 1, text: text(node).trim() });
    node.content?.forEach(walk);
  };
  if (body) walk(body);
  return found.filter(heading => heading.text);
}

/** 본문이 1단계 제목으로 시작하면 그 글(앞의 빈 문단은 건너뛴다). 인쇄가 문서 제목과 같은 제목을 두 번 쓰지 않는 데 쓴다. */
export function leadTitleOf(body: JSONNode | null | undefined): string | undefined {
  const text = (node: JSONNode): string => node.text ?? node.content?.map(text).join('') ?? '';
  const first = body?.content?.find(node => node.type !== 'paragraph' || text(node).trim());
  return first?.type === 'heading' && Number(first.attrs?.level) === 1 ? text(first).trim() || undefined : undefined;
}

/**
 * 상세 화면과 그 본문(RichBody)이 함께 쓰는 목차. 본문은 제목이 바뀔 때 알리고(publish), 화면은 그것으로 목차 버튼을
 * 그린다. 편집기 가장자리에 붙던 목차 표시(—)는 무엇인지 알기 어려워, 속성 칸이나 휴대폰 버튼으로 옮겼다.
 */
export const OutlineContext = createContext<{
  headings: BodyHeading[]; publish: (headings: BodyHeading[]) => void; versions: number; publishVersions: (count: number) => void;
} | null>(null);

/** 본문에 남은 버전 수(RichBody가 알린다). 상세의 정보 묶음이 '버전 N'으로 보이고 누르면 버전 기록을 연다. */
export const useBodyVersions = () => useContext(OutlineContext)?.versions ?? 0;
export const usePublishVersions = () => useContext(OutlineContext)?.publishVersions;
export const useBodyHeadings = () => useContext(OutlineContext)?.headings ?? [];
export const usePublishHeadings = () => useContext(OutlineContext)?.publish;
