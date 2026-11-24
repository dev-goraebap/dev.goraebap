import type { Playbook } from "./playbooks";
import { SKILLS, TOOLKITS, type SkillId } from "./skills";

// 플레이북이 쓰는 스킬을 처음 등장한 단계 순서대로, 같은 묶음끼리 모아 돌려준다.
export function usedSkills(playbook: Playbook): SkillId[] {
  const seen: SkillId[] = [];
  for (const step of playbook.steps)
    for (const id of step.skills) if (!seen.includes(id)) seen.push(id);
  const rank = (id: SkillId) => TOOLKITS.findIndex((toolkit) => toolkit.id === SKILLS[id].toolkit);
  return seen.sort((a, b) => rank(a) - rank(b));
}

export function toolkitOf(id: SkillId) {
  return TOOLKITS.find((toolkit) => toolkit.id === SKILLS[id].toolkit)!;
}
