import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ME_ID } from "../model/marks"
import type { Member, MyPatch } from "../model/types"
import { mockMembers } from "./mock"

const listKey = ["members"] as const
/** 내가 바꾼 것(그림 · 휴대전화)은 서버 대신 이 브라우저에 남긴다. */
const MINE_KEY = "shadcn-tailoring-my-profile"

function readMine(): MyPatch {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? "{}") as MyPatch
  } catch {
    return {}
  }
}

function writeMine(patch: MyPatch) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify({ ...readMine(), ...patch }))
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 바뀐다.
  }
}

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 내 줄에는 이 브라우저에 남긴 것을 덮는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))
const listOptions = queryOptions({
  queryKey: listKey,
  queryFn: () => later(mockMembers.map(member => (member.id === ME_ID ? { ...member, ...readMine() } : member))),
  staleTime: Infinity,
})

export function useMembers() {
  return useQuery(listOptions)
}

/** 아이디 하나의 구성원. 목록과 같은 캐시를 읽는다. 읽는 동안 undefined, 없으면 null. */
export function useMember(id: string) {
  return useQuery({ ...listOptions, select: (members: Member[]) => members.find(member => member.id === id) ?? null })
}

/** 내 그림 · 휴대전화를 바꾼다. 이 브라우저에 남기고 캐시의 내 줄을 고친다. */
export function useUpdateMe() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (patch: MyPatch) => {
      writeMine(patch)
      return patch
    },
    onSuccess: patch => client.setQueryData<Member[]>(listKey, old => old?.map(member => (member.id === ME_ID ? { ...member, ...patch } : member))),
  })
}
