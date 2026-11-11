import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Announcement, AnnouncementDraft } from "../model/types"
import { ME, mockAnnouncements } from "./mock"

const listKey = ["announcements"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const listOptions = {
  queryKey: listKey,
  queryFn: () => new Promise<Announcement[]>(resolve => setTimeout(() => resolve(mockAnnouncements()), 300)),
  staleTime: Infinity,
}

/** 모든 공지(게시일 순서는 화면이 정한다). */
export function useAnnouncements() {
  return useQuery(listOptions)
}

/** 공지 하나. 목록과 같은 캐시를 읽는다. 읽는 동안 undefined, 없으면 null. */
export function useAnnouncement(id: string) {
  return useQuery({ ...listOptions, select: (items: Announcement[]) => items.find(item => item.id === id) ?? null })
}

/** 새 공지를 "나"의 이름으로 바로 게시한다. */
export function useCreateAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (draft: AnnouncementDraft): Promise<Announcement> => {
      const items = client.getQueryData<Announcement[]>(listKey) ?? []
      const at = new Date().toISOString()
      const id = String(Math.max(100, ...items.map(item => Number(item.id))) + 1)
      return { ...draft, id, author: ME, publishedAt: at, updatedAt: at, readCount: 0, isRead: true, attachments: [] }
    },
    onSuccess: item => client.setQueryData<Announcement[]>(listKey, old => [...(old ?? []), item]),
  })
}

/** 공지를 고친다. 게시일은 그대로이고 수정일만 바뀐다. */
export function useUpdateAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: AnnouncementDraft }) => ({ id, draft, at: new Date().toISOString() }),
    onSuccess: ({ id, draft, at }) =>
      client.setQueryData<Announcement[]>(listKey, old => old?.map(item => (item.id === id ? { ...item, ...draft, updatedAt: at } : item))),
  })
}

/** 공지를 지운다. */
export function useDeleteAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => client.setQueryData<Announcement[]>(listKey, old => old?.filter(item => item.id !== id)),
  })
}

/** 처음 읽으면 읽음으로 두고 읽은 사람 수를 하나 늘린다. 이미 읽었으면 그대로다. */
export function useMarkAnnouncementRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => client.setQueryData<Announcement[]>(listKey, old => old?.map(item =>
      item.id === id && !item.isRead ? { ...item, isRead: true, readCount: item.readCount + 1 } : item)),
  })
}
