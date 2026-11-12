import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Project, ProjectIconName } from "@/entities/project"

/** 일반 설정에서 함께 저장하는 것(호호코워크 ProjectDraft): 표식 · 이름 · 키 · 설명. */
export type GeneralDraft = { key: string; name: string; description: string; icon: ProjectIconName; color: string }
/** 이 쪽이 기억하는 프로젝트: 저장한 내용과 삭제했는지. */
export type GeneralState = GeneralDraft & { isDeleted: boolean }

export const NAME_MAX = 64
export const DESCRIPTION_MAX = 20_000

export const draftOf = (state: GeneralDraft): GeneralDraft =>
  ({ key: state.key, name: state.name, description: state.description, icon: state.icon, color: state.color })

/*
 * 프로젝트 entity는 별표 · 보관만 바꾸므로, 이름 · 키 · 설명 · 표식과 삭제는 이 쪽의 캐시에만 남긴다(프로젝트 아이디마다).
 * 그래서 저장해도 메뉴 · 목록 · 경로의 이름은 그대로다.
 */
const stateKey = (projectId: string) => ["project-settings", "general", projectId] as const
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const fromProject = (project: Project): GeneralState => ({
  key: project.key, name: project.name, description: project.description ?? "", icon: project.icon, color: project.color, isDeleted: false,
})

/** 이 쪽이 기억하는 프로젝트. 처음에는 프로젝트 목록의 값으로 시작한다. */
export function useGeneralState(project: Project | null | undefined) {
  return useQuery({
    queryKey: stateKey(project?.id ?? ""),
    queryFn: () => fromProject(project!),
    enabled: !!project,
    staleTime: Infinity,
  })
}

/** 표식 · 이름 · 키 · 설명을 함께 저장한다. 다른 프로젝트가 쓰는 키면 막는다. */
export function useSaveGeneral(projectId: string, takenKeys: readonly string[]) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (draft: GeneralDraft) => {
      if (takenKeys.includes(draft.key)) throw new Error("다른 프로젝트가 쓰거나 썼던 키입니다. 다른 키를 적어 주세요.")
      return later(draft)
    },
    onSuccess: draft => client.setQueryData<GeneralState>(stateKey(projectId), old => (old ? { ...old, ...draft } : old)),
  })
}

/** 삭제 · 되살리기. 목록에서 빼지는 못하므로 이 쪽이 삭제한 프로젝트로 읽기만 보인다. */
export function useSetDeleted(projectId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (isDeleted: boolean) => later(isDeleted),
    onSuccess: isDeleted => client.setQueryData<GeneralState>(stateKey(projectId), old => (old ? { ...old, isDeleted } : old)),
  })
}
