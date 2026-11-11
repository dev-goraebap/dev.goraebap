import type { ReactNode } from "react"
import { Page, type Crumb } from "@/shared/ui/page"

type SettingsPageProps = {
  crumbs: Crumb[]
  title: string
  /** 이 페이지가 정하는 것을 한 줄로. */
  description?: ReactNode
  children: ReactNode
}

/**
 * 값을 보고 정하는 페이지의 틀(호호코워크 SettingsPage). 머리 줄(경로) 아래에 가운데 한 열(최대 720px),
 * 맨 위에 제목과 한 줄 설명, 그 아래에 SettingsSection이 이어진다.
 */
export function SettingsPage({ crumbs, title, description, children }: SettingsPageProps) {
  return (
    <Page crumbs={crumbs}>
      <main className="flex justify-center px-4 py-10">
        <div className="flex w-full max-w-180 min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </header>
          {children}
        </div>
      </main>
    </Page>
  )
}
