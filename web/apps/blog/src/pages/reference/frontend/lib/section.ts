import { SECTION_GROUPS, menuDocs, stacksOf } from "@/entities/content-doc";

// Reference › Frontend 주소: /reference/frontend/<문서>/<스택>(섹션 바로 아래 문서)과
// /reference/frontend/<묶음>/<문서>/<스택>(묶음 문서). 두 마디 주소는 마지막이 스택인지로 둘을 가른다.
export const ROOT = "reference/frontend";
export const STACKS = stacksOf(ROOT);
export const isGroup = (id: string) =>
  (SECTION_GROUPS[ROOT] ?? []).some((group) => group.id === id);
export const firstDocOf = (group: string) =>
  menuDocs(`${ROOT}/${group}`).find((doc) => !doc.isSkill);
