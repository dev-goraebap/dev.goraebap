import type { ReactNode } from "react"
import { Page, type Crumb } from "@/shared/ui/page"

type SettingsBodyProps = {
  title: string
  /** 이 페이지가 정하는 것을 한 줄로. */
  description?: ReactNode
  children: ReactNode
}

/**
 * 설정 페이지의 안쪽(호호코워크 SettingsPage 본문): 가운데 한 열(최대 720px), 맨 위에 제목과 한 줄 설명,
 * 그 아래에 SettingsSection이 이어진다. 페이지 틀(Page)을 따로 그리는 곳(프로젝트 설정)은 이것만 쓴다.
 */
export function SettingsBody({ title, description, children }: SettingsBodyProps) {
  return (
    // 앱 셸이 이미 main을 그리므로 여기서는 main을 겹치지 않는다.
    <div className="flex justify-center px-4 py-10 max-md:py-6">
      <div className="flex w-full max-w-180 min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </header>
        {children}
      </div>
    </div>
  )
}

/** 값을 보고 정하는 페이지(호호코워크 SettingsPage): 머리 줄(경로)과 SettingsBody. */
export function SettingsPage({ crumbs, ...body }: SettingsBodyProps & { crumbs: Crumb[] }) {
  return (
    <Page crumbs={crumbs}>
      <SettingsBody {...body} />
    </Page>
  )
}
