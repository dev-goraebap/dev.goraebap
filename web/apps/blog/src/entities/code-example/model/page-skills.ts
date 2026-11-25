// content 문서 밖의 페이지가 옮긴 지침. 이 지침을 링크한 예시가 그 페이지에 보인다.
// 경로는 plugins/webapp/skills 기준이고, check:skills가 이 파일의 skills 값도 확인한다.
export const PAGE_SKILLS: Record<string, { skills: string[] }> = {
  "/frontend/design-system/overview": {
    skills: ["frontend-design-system/references/icons.md"],
  },
  "/frontend/design-system/foundations/tokens": {
    skills: ["frontend-design-system/references/theme.md"],
  },
  "/playbook/project-setup": {
    skills: ["goraebap-mode/references/examples.md"],
  },
  "/playbook/feature": {
    skills: ["webapp-project/references/open-source.md"],
  },
};

export const pageSkills = (path: string) => PAGE_SKILLS[path]?.skills ?? [];
