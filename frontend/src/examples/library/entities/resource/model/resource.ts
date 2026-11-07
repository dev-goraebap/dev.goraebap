import type { JSONContent } from "@tiptap/react";
export type ResourceKind = "link" | "document" | "image";
export type Resource = {
  id: string;
  title: string;
  summary: string;
  body: JSONContent;
  kind: ResourceKind;
  collection: string;
  url?: string;
  starred: boolean;
  updatedAt: string;
  author: string;
};
export type NewResource = Omit<
  Resource,
  "id" | "updatedAt" | "author" | "starred"
>;
export const kindLabels: Record<ResourceKind, string> = {
  link: "링크",
  document: "문서",
  image: "이미지",
};
export const collections = [
  { id: "design", name: "디자인 참고", color: "blue" },
  { id: "development", name: "개발 자료", color: "amber" },
  { id: "reading", name: "읽을거리", color: "sage" },
] as const;
export const collectionName = (id: string) =>
  collections.find((item) => item.id === id)?.name ?? "미분류";
export function plainText(node?: JSONContent): string {
  return node?.text ?? node?.content?.map(plainText).join(" ") ?? "";
}
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
