import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Announcement, AnnouncementEdit, AnnouncementFile, NewAnnouncement } from "../model/types"
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

/** 고른 파일을 이 브라우저 안의 주소(object URL)로 붙인다. 올릴 서버가 없어 새로고침하면 사라진다. */
const attach = (file: File, id: string): AnnouncementFile => ({
  id, name: file.name, size: file.size, isImage: file.type.startsWith("image/"), url: URL.createObjectURL(file),
})

/** 뺀 첨부 · 지운 공지의 파일 주소를 놓아 브라우저가 메모리를 돌려받게 한다. */
const release = (files: AnnouncementFile[]) => files.forEach(file => { if (file.url) URL.revokeObjectURL(file.url) })

/** 붙인 때와 차례로 아이디를 지어, 고칠 때 더한 파일도 앞의 첨부와 겹치지 않는다. */
const attachAll = (files: File[], noticeId: string) => {
  const at = Date.now()
  return files.map((file, index) => attach(file, `${noticeId}-file-${at}-${index}`))
}

/** 새 공지를 "나"의 이름으로 바로 게시한다. 고른 파일은 첨부가 된다(호호코워크는 본문 끝에도 링크를 단다). */
export function useCreateAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, ...draft }: NewAnnouncement): Promise<Announcement> => {
      const items = client.getQueryData<Announcement[]>(listKey) ?? []
      const at = new Date().toISOString()
      const id = String(Math.max(100, ...items.map(item => Number(item.id))) + 1)
      return { ...draft, id, author: ME, publishedAt: at, updatedAt: at, readCount: 0, isRead: true, attachments: attachAll(files, id) }
    },
    onSuccess: item => client.setQueryData<Announcement[]>(listKey, old => [...(old ?? []), item]),
  })
}

/** 공지를 고친다. 게시일은 그대로이고 수정일만 바뀐다. 뺀 첨부는 주소를 놓고, 더한 파일은 끝에 붙는다. */
export function useUpdateAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (edit: AnnouncementEdit) => ({ ...edit, at: new Date().toISOString() }),
    onSuccess: ({ id, draft, add, remove, at }) => client.setQueryData<Announcement[]>(listKey, old => old?.map(item => {
      if (item.id !== id) return item
      release(item.attachments.filter(file => remove.includes(file.id)))
      const kept = item.attachments.filter(file => !remove.includes(file.id))
      return { ...item, ...draft, updatedAt: at, attachments: [...kept, ...attachAll(add, id)] }
    })),
  })
}

/** 공지를 지운다. */
export function useDeleteAnnouncement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => client.setQueryData<Announcement[]>(listKey, old => {
      const gone = old?.find(item => item.id === id)
      if (gone) release(gone.attachments)
      return old?.filter(item => item.id !== id)
    }),
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
