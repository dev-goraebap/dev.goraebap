import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { DetailSurface } from "@/shared/ui/kit/detail-surface"
import { Page, type Crumb } from "@/shared/ui/kit/layout/page"
import { SettingsBody } from "./SettingsPage"

/** 상세가 놓이는 곳: 자기 페이지, 또는 목록 위 대화상자(닫기 · 페이지로 열기와 함께). */
export type AdminSurfaceOptions = { surface?: "page" | "dialog"; onClose?: () => void; onExpand?: () => void }

/**
 * 관리 화면의 상세 · 양식 하나: 제목 · 설명 아래 설정 단, 끝에 동작(footer: 저장 · 취소).
 * - 데스크톱 자기 페이지: 다른 상세와 같은 뒤로가기 틀(DetailSurface page). 둥근 ← 는 경로의 위 단계(목록)로 가고,
 *   동작은 단의 끝에 선다.
 * - 목록 위: 키트 대화상자에 같은 단, 동작은 끝에.
 * - 휴대폰: 늘 페이지(앱 바 ← 와 아래 동작 줄).
 */
export function AdminSurface({ surface = "page", onClose, onExpand, crumbs, title, description, actions, footer, children }: AdminSurfaceOptions & {
  crumbs: Crumb[]; title: string; description?: ReactNode; actions?: ReactNode; footer?: ReactNode; children: ReactNode
}) {
  const isMobile = useIsMobile()
  if (isMobile) return (
    <Page crumbs={crumbs} actions={actions} footer={footer} isFullScreen>
      <SettingsBody title={title} description={description}>{children}</SettingsBody>
    </Page>
  )
  if (surface === "page") return (
    <DetailSurface surface="page" title={title} crumbs={crumbs} actions={actions}>
      <SettingsBody title={title} description={description}>
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </SettingsBody>
    </DetailSurface>
  )
  return (
    <DetailSurface surface="dialog" title={title} crumbs={crumbs} actions={actions} onClose={onClose} onExpand={onExpand}>
      <div className="flex min-w-0 flex-col gap-8">
        {description ? <p className="text-muted-foreground">{description}</p> : null}
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </DetailSurface>
  )
}
