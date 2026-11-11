import { toast } from "@/shared/ui/toast"

/** 공지 상세의 주소. 라우트 /announcements/$announcementId와 같다. */
export const announcementHref = (id: string) => `/announcements/${encodeURIComponent(id)}`

/** 공지 상세의 주소를 복사하고 알린다. */
export async function copyAnnouncementLink(id: string) {
  try {
    await navigator.clipboard.writeText(`${location.origin}${announcementHref(id)}`)
    toast.add({ type: "success", title: "링크를 복사했습니다" })
  } catch {
    toast.add({ type: "error", title: "복사하지 못했습니다" })
  }
}
