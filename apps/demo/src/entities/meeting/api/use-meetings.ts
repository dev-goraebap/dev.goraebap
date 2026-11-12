import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Meeting, MeetingDraft, MeetingFile, NewMeeting } from "../model/types"
import { ME, mockMeetings } from "./mock"

const listKey = ["meetings"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const listOptions = {
  queryKey: listKey,
  queryFn: () => new Promise<Meeting[]>(resolve => setTimeout(() => resolve(mockMeetings()), 300)),
  staleTime: Infinity,
}

/** 모든 회의록(순서는 화면이 정한다). */
export function useMeetings() {
  return useQuery(listOptions)
}

/** 회의록 하나. 목록과 같은 캐시를 읽는다. 읽는 동안 undefined, 없으면 null. */
export function useMeeting(id: string) {
  return useQuery({ ...listOptions, select: (items: Meeting[]) => items.find(item => item.id === id) ?? null })
}

/** 고른 파일을 이 브라우저 안의 주소(object URL)로 붙인다. 올릴 서버가 없어 새로고침하면 사라진다. */
const attach = (file: File, id: string): MeetingFile => ({ id, name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) })

/** 지운 회의록의 파일 주소를 놓아 브라우저가 메모리를 돌려받게 한다. */
const release = (meeting: Meeting) => [meeting.audio, ...meeting.photos].forEach(file => { if (file?.url) URL.revokeObjectURL(file.url) })

/**
 * 새 회의록을 "나"의 이름으로 만든다. 호호코워크처럼 녹음과 사진을 붙여 받아쓰기 차례를 기다리는 상태로 들어가며,
 * 받아쓰고 요약하는 서버가 없으므로 이 앱에서는 그 상태에 머문다.
 */
export function useCreateMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ audio, photos, ...draft }: NewMeeting): Promise<Meeting> => {
      const items = client.getQueryData<Meeting[]>(listKey) ?? []
      const id = String(Math.max(200, ...items.map(item => Number(item.id))) + 1)
      return {
        ...draft, id, status: "waiting", author: ME, createdAt: new Date().toISOString(),
        agenda: [], decisions: [], actionItems: [], summary: "", transcript: [],
        audio: attach(audio, `${id}-audio`), photos: photos.map((photo, index) => attach(photo, `${id}-photo-${index}`)),
      }
    },
    onSuccess: item => client.setQueryData<Meeting[]>(listKey, old => [...(old ?? []), item]),
  })
}

/** 제목 · 프로젝트 · 회의 일시 · 참석자 · 참고 메모를 고친다. */
export function useUpdateMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: MeetingDraft }) => ({ id, draft }),
    onSuccess: ({ id, draft }) => client.setQueryData<Meeting[]>(listKey, old => old?.map(item => (item.id === id ? { ...item, ...draft } : item))),
  })
}

/** 회의록을 지운다. */
export function useDeleteMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => client.setQueryData<Meeting[]>(listKey, old => {
      const gone = old?.find(item => item.id === id)
      if (gone) release(gone)
      return old?.filter(item => item.id !== id)
    }),
  })
}
