import type { DocsNavGroup } from "@/shared/ui";
import { SECTION_GROUPS, menuDocs, type ContentDoc } from "./content";

// 문서를 머리말의 묶음(group)별로 하나의 사이드바 묶음으로 모은다. AI 지침(SKILL.md)은 이름 없는 자기 묶음에 둔다.
export function contentNavGroups(
  docs: readonly ContentDoc[],
  hrefFor: (doc: ContentDoc) => string,
): DocsNavGroup[] {
  const groups: DocsNavGroup[] = [];
  const byTitle = new Map<string, DocsNavGroup>();
  for (const doc of docs) {
    const title = doc.isSkill ? undefined : doc.meta.group || undefined;
    let group: DocsNavGroup | undefined;
    if (title) {
      group = byTitle.get(title);
      if (!group) {
        group = { title, items: [] };
        byTitle.set(title, group);
        groups.push(group);
      }
    } else {
      group = doc.isSkill ? undefined : groups.at(-1);
      if (!group || group.title !== undefined || doc.isSkill) {
        groups.push((group = { title: undefined, items: [] }));
      }
    }
    group.items.push({
      label: doc.meta.title ?? doc.slug,
      href: hrefFor(doc),
      icon: doc.isSkill ? "details" : doc.meta.icon,
      badge: doc.isSkill ? "AI" : undefined,
    });
  }
  return groups;
}

// 섹션(하위 폴더를 묶음으로 쓰는 메뉴)의 사이드바: 섹션 바로 아래 문서, 폴더 묶음, 맨 끝에 AI 지침.
export function sectionNavGroups(
  root: string,
  hrefFor: (doc: ContentDoc) => string,
): DocsNavGroup[] {
  const item = (doc: ContentDoc) => ({
    label: doc.meta.title ?? doc.slug,
    href: hrefFor(doc),
    icon: doc.isSkill ? ("details" as const) : doc.meta.icon,
    badge: doc.isSkill ? "AI" : undefined,
  });
  const top = menuDocs(root);
  const groups: DocsNavGroup[] = [];
  const lead = top.filter((doc) => !doc.isSkill);
  if (lead.length) groups.push({ items: lead.map(item) });
  for (const group of SECTION_GROUPS[root] ?? []) {
    const docs = menuDocs(`${root}/${group.id}`).filter((doc) => !doc.isSkill);
    if (docs.length) groups.push({ title: group.title, items: docs.map(item) });
  }
  const skill = top.filter((doc) => doc.isSkill);
  if (skill.length) groups.push({ items: skill.map(item) });
  return groups;
}
