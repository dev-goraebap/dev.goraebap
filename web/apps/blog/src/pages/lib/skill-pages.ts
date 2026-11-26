import { PAGE_SKILLS } from "@/entities/code-example";

// content에 없는 스킬 파일을 그 지침을 다루는 사이트 페이지로 잇는다. content 메뉴 문서가 함께 쓴다.
const SKILL_PAGES = new Map<string, string>(
  Object.entries(PAGE_SKILLS).flatMap(([href, { skills }]) =>
    skills.map((skill) => [skill, href] as const),
  ),
);

export const skillPageHref = (skill: string) => SKILL_PAGES.get(skill);
