import { useEffect, useState } from "react"
import { GlobeIcon, ImageIcon, PencilIcon, SquareArrowOutUpRightIcon } from "@/shared/ui/icon"
import { BlockTool, BlockTools } from "./MediaView"
import type { LinkPreview } from "./types"
import { previewOf, useEditorHost } from "./zoom"

/**
 * 링크 카드: 웹 주소 하나를 제목 · 설명 · 대표 사진이 있는 카드로 보여 준다. 미리보기는 호스트의 함수가 읽고(서버가 읽어야 한다),
 * 읽지 못하면 주소만 있는 카드가 된다. 읽는 화면에서는 카드 전체가 새 탭으로 여는 링크이고, 고치는 화면에서는 누르면 블록이
 * 선택되며 열기 · 주소 고치기는 위에 뜨는 도구로 한다. 카드 전체를 덮는 링크와 사진은 키트 부품에 맞는 것이 없어 <a> · <img>로 둔다.
 */
export function LinkCard({ url, host, isEditable, onEdit }: { url: string; host: string; isEditable: boolean; onEdit: () => void }) {
  const { readPreview } = useEditorHost()
  const [preview, setPreview] = useState<LinkPreview | null>(null), [noPicture, setNoPicture] = useState(false)
  useEffect(() => {
    let live = true
    setPreview(null); setNoPicture(false)
    if (!readPreview) { setPreview({ url, site: host }); return }
    previewOf(readPreview, url).then(found => { if (live) setPreview(found) }).catch(() => { if (live) setPreview({ url, site: host }) })
    return () => { live = false }
  }, [url, host, readPreview])
  const title = preview?.title || host, site = preview?.site || host
  return (
    <div className="group/block relative">
      {isEditable ? (
        <BlockTools>
          <BlockTool label="새 탭에서 열기" nativeButton={false} render={<a href={url} target="_blank" rel="noopener noreferrer" />}><SquareArrowOutUpRightIcon /></BlockTool>
          <BlockTool label="링크 카드 주소 고치기" tip="주소 고치기" onClick={onEdit}><PencilIcon /></BlockTool>
        </BlockTools>
      ) : null}
      <a href={url} target="_blank" rel="noopener noreferrer" data-loading={preview ? undefined : ""} draggable={false}
        className="group/card flex min-h-26 items-stretch overflow-hidden rounded-[0.625rem] border bg-card text-foreground no-underline! transition-colors hover:border-input hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring in-data-selected:border-ring"
        onClick={event => { if (isEditable) event.preventDefault() }}>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3">
          <span className="truncate text-sm leading-snug font-semibold group-data-loading/card:text-muted-foreground">{preview ? title : host}</span>
          {preview?.description ? <span className="line-clamp-2 text-[0.78125rem] leading-normal text-muted-foreground">{preview.description}</span> : null}
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.25 [&_svg]:flex-none">
            <GlobeIcon /><span className="truncate">{site}</span>
            {site !== host ? <span className="truncate opacity-70">{host}</span> : null}
          </span>
        </div>
        {/* 사진 칸은 늘 둔다: 페이지가 대표 사진을 밝히지 않았거나 받지 못하면 같은 자리에 빈 칸 표시를 둬 카드 모양을 맞춘다. */}
        {preview?.image && !noPicture ? (
          <div className="w-[min(34%,14rem)] flex-none border-l bg-muted max-[34.375rem]:w-22">
            <img src={preview.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} onError={() => setNoPicture(true)}
              className="m-0! block size-full max-w-none rounded-none! object-cover" />
          </div>
        ) : (
          <div className="flex w-[min(34%,14rem)] flex-none flex-col items-center justify-center gap-1.5 border-l bg-muted p-2.5 text-center text-xs text-muted-foreground max-[34.375rem]:w-22 [&_svg]:size-5 [&_svg]:opacity-85">
            <ImageIcon /><span>{preview ? "대표 이미지가 없습니다" : "불러오는 중…"}</span>
          </div>
        )}
      </a>
    </div>
  )
}
