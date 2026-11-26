import type { DocsNavGroup } from "@/shared/ui";
import type { ContentDoc } from "./content";

// 문서를 머리말의 묶음(group)이 바뀔 때마다 새 사이드바 묶음으로 나눈다. AI 지침(SKILL.md)은 이름 없는 자기 묶음에 둔다.
export function contentNavGroups(
  docs: readonly ContentDoc[],
  hrefFor: (doc: ContentDoc) => string,
): DocsNavGroup[] {
  const groups: DocsNavGroup[] = [];
  for (const doc of docs) {
    const title = doc.isSkill ? undefined : doc.meta.group || undefined;
    let group = groups.at(-1);
    if (!group || group.title !== title || doc.isSkill) groups.push((group = { title, items: [] }));
    group.items.push({
      label: doc.meta.title ?? doc.slug,
      href: hrefFor(doc),
      icon: doc.isSkill ? "details" : doc.meta.icon,
      badge: doc.isSkill ? "AI" : undefined,
    });
  }
  return groups;
}
