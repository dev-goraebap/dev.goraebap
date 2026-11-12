import type { Project, ProjectEdit } from "@/entities/project"

/** 일반 설정에서 함께 저장하는 것(호호코워크 ProjectDraft): 표식 · 이름 · 키 · 설명. */
export type GeneralDraft = Required<ProjectEdit>

export const NAME_MAX = 64
export const DESCRIPTION_MAX = 20_000

export const draftOf = (project: Project): GeneralDraft =>
  ({ key: project.key, name: project.name, description: project.description ?? "", icon: project.icon, color: project.color })
