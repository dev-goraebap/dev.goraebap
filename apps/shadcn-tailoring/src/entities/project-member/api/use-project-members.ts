import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ProjectMember } from "../model/types"
import { mockProjectMembers } from "./mock"

const listKey = ["project-members"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))
const listOptions = queryOptions({ queryKey: listKey, queryFn: () => later(mockProjectMembers), staleTime: Infinity })

const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/** 프로젝트 하나의 멤버(참여한 순서). 주소의 소문자 키도 받는다. */
export function useProjectMembers(projectKey: string) {
  const wanted = projectKey.toUpperCase()
  return useQuery({
    ...listOptions,
    select: (members: ProjectMember[]) => members.filter(member => member.projectKey === wanted)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
  })
}

/** 구성원을 프로젝트 멤버로 넣는다(오늘 참여한 멤버). 이미 있으면 막는다. */
export function useAddProjectMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectKey, memberId }: { projectKey: string; memberId: string }): Promise<ProjectMember> => {
      const key = projectKey.toUpperCase()
      const members = client.getQueryData<ProjectMember[]>(listKey) ?? []
      if (members.some(member => member.projectKey === key && member.memberId === memberId)) throw new Error("이미 이 프로젝트의 멤버입니다.")
      return later({ projectKey: key, memberId, role: "member", joinedAt: today() })
    },
    onSuccess: member => client.setQueryData<ProjectMember[]>(listKey, old => [...(old ?? []), member]),
  })
}

/** 프로젝트에서 멤버를 뺀다. 구성원 정보와 프로젝트는 그대로다. */
export function useRemoveProjectMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ projectKey, memberId }: { projectKey: string; memberId: string }) => later({ projectKey: projectKey.toUpperCase(), memberId }),
    onSuccess: ({ projectKey, memberId }) => client.setQueryData<ProjectMember[]>(listKey, old =>
      old?.filter(member => !(member.projectKey === projectKey && member.memberId === memberId))),
  })
}
