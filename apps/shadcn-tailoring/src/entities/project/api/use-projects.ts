import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { NewProject, Project, ProjectPatch } from "../model/types"
import { mockProjects } from "./mock"

const listKey = ["projects"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

/** 회사의 프로젝트(진행 중 · 보관 모두, 관리자가 정한 순서). 보기는 화면이 상태로 나눈다. */
const listOptions = { queryKey: listKey, queryFn: () => later(mockProjects), staleTime: Infinity }

export function useProjects() {
  return useQuery(listOptions)
}

/** 키 하나의 프로젝트(주소의 소문자 키도 받는다). 읽는 동안 undefined, 없으면 null. */
export function useProject(key: string) {
  const wanted = key.toLowerCase()
  return useQuery({ ...listOptions, select: (projects: Project[]) => projects.find(project => project.key.toLowerCase() === wanted) ?? null })
}

/** 주소가 들어 있는 프로젝트(/projects/$projectKey/…). key는 주소의 소문자 키, project는 읽는 동안 undefined · 없으면 null. */
export function useCurrentProject() {
  const { projectKey = "" } = useParams({ strict: false }) as { projectKey?: string }
  return { key: projectKey, project: useProject(projectKey).data }
}

/** 별표 · 보관을 바꾼다. 화면이 바로 바뀌도록 캐시를 먼저 고친다. */
export function useUpdateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, patch }: { key: string; patch: ProjectPatch }) => ({ key, patch }),
    onMutate: ({ key, patch }) => client.setQueryData<Project[]>(listKey, old =>
      old?.map(project => (project.key === key ? { ...project, ...patch } : project))),
  })
}

/** 새 프로젝트를 맨 끝 순서로 넣는다. 만든 사람이 멤버가 되므로 멤버 1명, 진행 0%로 시작한다. */
export function useCreateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewProject): Promise<Project> => {
      const projects = client.getQueryData<Project[]>(listKey) ?? []
      if (projects.some(project => project.key === input.key)) throw new Error("다른 프로젝트가 쓰는 키입니다. 다른 키를 적어 주세요.")
      return {
        ...input, id: `project-${Date.now()}`, memberCount: 1, progress: 0, status: "active", starred: true,
        position: Math.max(-1, ...projects.map(project => project.position)) + 1,
      }
    },
    onSuccess: project => client.setQueryData<Project[]>(listKey, old => [...(old ?? []), project]),
  })
}
