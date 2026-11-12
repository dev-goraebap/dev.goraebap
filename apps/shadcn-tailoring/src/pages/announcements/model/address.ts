import { announcementHref } from "@/entities/announcement"
import { paths } from "@/shared/config"

/** 새 공지의 페이지. */
export const NEW_HREF = `${paths.announcements}/new`

/** 공지 수정의 페이지(/announcements/{id}/edit). */
export const editHref = (id: string) => `${announcementHref(id)}/edit`

/** 대화상자 주소가 새 공지 · 공지 수정인지(호호코워크 PanelHost의 NOTICE_EDIT). */
export function composeTarget(pathname: string | undefined): { id?: string } | undefined {
  if (pathname === NEW_HREF) return {}
  const edit = /^\/announcements\/([^/]+)\/edit$/.exec(pathname ?? "")
  return edit ? { id: decodeURIComponent(edit[1]) } : undefined
}

/** 목록 위 대화상자의 주소: 새 공지 · 공지 수정 · 공지 하나(호호코워크 PanelHost의 공지 몫). */
export function panelTarget(pathname: string | undefined): { kind: "new" } | { kind: "edit" | "detail"; id: string } | undefined {
  const compose = composeTarget(pathname)
  if (compose) return compose.id ? { kind: "edit", id: compose.id } : { kind: "new" }
  const detail = /^\/announcements\/([^/]+)$/.exec(pathname ?? "")
  return detail ? { kind: "detail", id: decodeURIComponent(detail[1]) } : undefined
}
