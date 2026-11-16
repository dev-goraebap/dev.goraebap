import type { JSONContent } from "@tiptap/react"
import { useRef, useState, type ReactNode } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { EditorToolbar, RichEditor, type EditorHandle, type LinkChoice, type ReadLinkPreview, type UploadFile } from "@/shared/ui/editor"
import { SettingsIcon } from "@/shared/ui/icon"
import { DocumentSettings, type SettingsTab } from "./DocumentSettings"
import { useFitZoom, useIsPhoneScreen } from "./hooks"
import { DEFAULT_PAGE_SETUP, formatOf, type DocumentMode, type PageLook, type PageSetup } from "./model"
import type { PageArea } from "./PageCanvas"
import type { PageLayout } from "./pagination"
import { usePagedFrame } from "./usePagedFrame"
import { ZoomControl, type ZoomSetting } from "./ZoomControl"

/**
 * 책상: 종이를 가운데 둔다. 종이는 폭에 맞춰 줄어들므로 가로 스크롤을 두지 않는다(스크롤바가 생겼다 사라지며 흔들리지 않게).
 * 손으로 키운 배율이 칸보다 넓으면 그때만 가로로 민다. 연한 바탕 모양이면 바깥을 테마에 맞춰 아주 옅게 다른 색으로 둔다.
 */
export const DESK = "flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4 overflow-x-clip overflow-y-auto bg-card px-4 pt-6 pb-10 [scrollbar-gutter:stable] "
  + "has-[[data-look=tinted]]:bg-[color-mix(in_oklab,var(--card),var(--foreground)_3.5%)] data-wide:items-start data-wide:overflow-x-auto "
  + "print:overflow-visible print:bg-transparent print:p-0"
/** 페이지 없음: 읽는 폭(45rem) 한 열에 이어 쓴다. */
export const PAGELESS = "flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4 overflow-y-auto bg-background px-4 pt-6 pb-10 [scrollbar-gutter:stable] print:overflow-visible print:p-0"
export const COLUMN = "w-full max-w-180"

/**
 * 문서 편집기. 위에 늘 붙은 서식 막대(왼쪽 확대/축소, 오른쪽 문서 설정과 toolbarEnd), 아래에 본문과 문서 설정 칸이다.
 * 페이지 모드는 종이(setup의 용지 · 방향 · 여백) 위에 쓰며 페이지 끝을 넘는 블록 · 줄 · 표 행이 다음 페이지로 넘어가고, 머리말 · 바닥글이 종이
 * 여백에 보인다(올리면 연필 단추, 누르면 설정 칸의 그 자리로). 페이지 없음은 읽는 폭 한 열에 이어 쓴다. 휴대폰은 늘 페이지 없음이다.
 * 페이지 설정을 바꾸면 에디터를 새로 만들지 않고 다시 나눈다. 모드를 바꾸면 에디터를 새로 만들되 쓴 내용은 그대로다(실행 취소 기록만 처음부터).
 * value는 처음 값이다. onSetupChange가 없으면 문서 설정 칸을 두지 않는다. look은 보는 사람의 화면 설정(PageLookMenu)이다.
 * 편집기는 놓인 칸의 높이를 채우고, 본문 · 설정 칸이 각자 스크롤한다(그래야 칸 사이 경계선이 위아래 끝까지 이어진다).
 */
export function DocumentEditor({ value, onChange, mode = "pages", setup = DEFAULT_PAGE_SETUP, onSetupChange, look, onLayout, above, toolbarEnd, label = "본문", placeholder,
  upload, readPreview, links }: {
  value: JSONContent; onChange: (value: JSONContent) => void; mode?: DocumentMode; setup?: PageSetup; onSetupChange?: (setup: PageSetup) => void
  look?: PageLook; onLayout?: (layout: PageLayout) => void
  /** 본문 위(제목 칸 등): 페이지 없음은 본문 열 폭, 페이지는 종이의 본문 여백에 맞춘다. */
  above?: ReactNode
  /** 서식 막대 오른쪽 끝(페이지 모양 · 보기 전환 등). */
  toolbarEnd?: ReactNode
  label?: string; placeholder?: string; upload?: UploadFile; readPreview?: ReadLinkPreview; links?: LinkChoice[]
}) {
  const isPhone = useIsPhoneScreen()
  const isPaged = !isPhone && mode === "pages"
  const canSet = !!onSetupChange && isPaged
  const [handle, setHandle] = useState<EditorHandle | null>(null)
  const [zoomSetting, setZoomSetting] = useState<ZoomSetting>("fit")
  const [settings, setSettings] = useState<{ tab: SettingsTab; focus: PageArea | null } | null>(null)
  // 모드를 바꿔 에디터를 새로 만들 때 지금까지 쓴 내용으로 시작한다.
  const latest = useRef(value)
  const format = formatOf(setup)
  const { ref, zoom: fit } = useFitZoom(format.width)
  const zoom = zoomSetting === "fit" ? fit : zoomSetting / 100
  const { extensions, frame } = usePagedFrame({ isPaged, setup, look, zoom, handle, onLayout,
    onEditArea: canSet ? area => setSettings({ tab: "headerFooter", focus: area }) : undefined,
    activeArea: settings?.tab === "headerFooter" ? settings.focus : null })
  const rem = (px: number) => `calc(${px / 16}rem * ${zoom})`
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative z-6 flex-none print:hidden">
        <EditorToolbar handle={handle} links={links}
          start={isPaged ? <ZoomControl value={zoomSetting} current={zoom} onChange={setZoomSetting} /> : undefined}
          end={<>
            {canSet ? (
              <Button variant="ghost" size="icon-sm" aria-label="문서 설정" title="문서 설정 (용지 · 여백 · 머리말 · 바닥글)" aria-pressed={!!settings}
                className="text-icon-muted aria-pressed:bg-pressed aria-pressed:text-foreground" onClick={() => setSettings(now => now ? null : { tab: "document", focus: null })}>
                <SettingsIcon />
              </Button>
            ) : null}
            {toolbarEnd}
          </>} />
      </div>
      <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
        <div ref={ref} className={isPaged ? DESK : PAGELESS} data-wide={isPaged && zoom > fit + 0.001 ? "" : undefined}>
          {above ? (
            <div className={isPaged ? "box-border max-w-full" : COLUMN}
              // check-ui: allow-style 종이의 본문 여백에 맞춘 폭이다(배율에 따라 바뀐다).
              style={isPaged ? { inlineSize: rem(format.width), paddingInline: `${rem(format.marginLeft)} ${rem(format.marginRight)}` } : undefined}>{above}</div>
          ) : null}
          <div className={cn(!isPaged && COLUMN)}>
            <RichEditor key={isPaged ? "pages" : "pageless"} value={latest.current} onChange={next => { latest.current = next; onChange(next) }} isEditable isPage
              label={label} placeholder={placeholder} upload={upload} readPreview={readPreview} links={links} onReady={setHandle} extensions={extensions} frame={frame} />
          </div>
        </div>
        {canSet && settings ? <DocumentSettings setup={setup} onChange={onSetupChange!} tab={settings.tab} focus={settings.focus}
          onTab={tab => setSettings({ tab, focus: null })} onClose={() => setSettings(null)} /> : null}
      </div>
    </div>
  )
}
