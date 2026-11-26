import { SECTION_GROUPS, menuDocs, stacksOf } from "@/entities/content-doc";

// Reference › Backend 주소: /reference/backend/<묶음>/<문서>/<스택>. 두 마디 주소는 마지막이 스택인지로
// 섹션 바로 아래 문서(<문서>/<스택>)와 묶음 문서의 스택 없는 주소(<묶음>/<문서>)를 가른다.
export const ROOT = "reference/backend";
export const STACKS = stacksOf(ROOT);
export const isGroup = (id: string) =>
  (SECTION_GROUPS[ROOT] ?? []).some((group) => group.id === id);
export const firstDocOf = (group: string) =>
  menuDocs(`${ROOT}/${group}`).find((doc) => !doc.isSkill);
