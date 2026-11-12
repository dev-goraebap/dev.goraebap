import { toast } from "@/shared/ui/toast"

/** 회의록 상세의 주소. 라우트 /meetings/$meetingId와 같다. */
export const meetingHref = (id: string) => `/meetings/${encodeURIComponent(id)}`

/** 회의록 상세의 주소를 복사하고 알린다. */
export async function copyMeetingLink(id: string) {
  try {
    await navigator.clipboard.writeText(`${location.origin}${meetingHref(id)}`)
    toast.add({ type: "success", title: "링크를 복사했습니다" })
  } catch {
    toast.add({ type: "error", title: "복사하지 못했습니다" })
  }
}
