import type { JSONContent } from '@tiptap/react';
import type { IconName } from '@kit/foundations/icons/solar-icon';

export type ResourceKind = 'link' | 'document' | 'image';
export type Resource = {
  id: string;
  title: string;
  summary: string;
  body: JSONContent;
  kind: ResourceKind;
  collection: string;
  url?: string;
  files: string[];
  starred: boolean;
  updatedAt: string;
  author: string;
};
export type NewResource = Pick<Resource, 'title' | 'body' | 'kind' | 'collection' | 'url' | 'files'>;

export const kinds: { id: ResourceKind; label: string; icon: IconName }[] = [
  { id: 'document', label: '문서', icon: 'document' },
  { id: 'link', label: '링크', icon: 'link' },
  { id: 'image', label: '이미지', icon: 'image' },
];
export const kindOf = (id: ResourceKind) => kinds.find(kind => kind.id === id)!;

export const collections = [
  { id: 'design', name: '디자인 참고' },
  { id: 'development', name: '개발 자료' },
  { id: 'reading', name: '읽을거리' },
] as const;
export const collectionName = (id: string) => collections.find(item => item.id === id)?.name ?? '미분류';

export const authors = ['서윤', '지우', '도현'];

export function plainText(node?: JSONContent): string {
  return node?.text ?? node?.content?.map(plainText).join(' ') ?? '';
}

export const dateText = (value: string) =>
  new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
