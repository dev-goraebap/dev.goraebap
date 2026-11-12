import { useId } from "react"
import { sizeText, type AnnouncementFile } from "@/entities/announcement"
import { Button } from "@/shared/ui/button"
import { DownloadIcon, FileIcon, ImageIcon, SquareArrowOutUpRightIcon } from "@/shared/ui/icon"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/shared/ui/item"
import { toast } from "@/shared/ui/toast"

/** 예시 공지의 파일은 실제 파일이 없다. 내려받기는 무엇을 받았을지 알리기만 한다. */
const announce = (file: AnnouncementFile) =>
  toast.add({ type: "info", title: `${file.name}`, description: "예시 공지라 내려받을 파일이 없습니다." })

/**
 * 파일 하나의 동작. 이 브라우저에서 붙인 파일(url)은 새 탭에서 열고 download로 원래 이름 그대로 받는다.
 * 예시 공지의 파일은 내려받기만 있고 알리기만 한다.
 */
function FileActions({ file }: { file: AnnouncementFile }) {
  if (!file.url) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label={`${file.name} 내려받기`} title="내려받기" className="max-md:size-11" onClick={() => announce(file)}>
        <DownloadIcon />
      </Button>
    )
  }
  return (
    <>
      <Button variant="ghost" size="icon-sm" nativeButton={false} aria-label={`${file.name} 열기`} title="열기" className="max-md:size-11"
        render={<a href={file.url} target="_blank" rel="noreferrer" />}>
        <SquareArrowOutUpRightIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" nativeButton={false} aria-label={`${file.name} 내려받기`} title="내려받기" className="max-md:size-11"
        render={<a href={file.url} download={file.name} />}>
        <DownloadIcon />
      </Button>
    </>
  )
}

/**
 * 공지 첨부(호호코워크 ReadingPart + FileList): "첨부 N개" 소제목 아래 표식(붙인 사진이면 미리보기) · 이름 · 크기 · 동작 줄.
 */
export function AnnouncementFiles({ files }: { files: AnnouncementFile[] }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 pt-2">
      <h2 id={titleId} className="text-base font-semibold">첨부 {files.length}개</h2>
      <ItemGroup aria-label="공지 첨부" className="gap-0 squircle rounded-xl border bg-card">
        {files.map(file => (
          <Item key={file.id} role="listitem" variant="outline" size="sm" className="rounded-none border-0 not-last:border-b">
            {file.isImage && file.url
              ? <ItemMedia variant="image"><img src={file.url} alt="" className="object-cover" /></ItemMedia>
              : <ItemMedia variant="icon">{file.isImage ? <ImageIcon /> : <FileIcon />}</ItemMedia>}
            <ItemContent className="min-w-0">
              <ItemTitle className="truncate">{file.name}</ItemTitle>
              <ItemDescription>{sizeText(file.size)}</ItemDescription>
            </ItemContent>
            <ItemActions className="gap-0.5"><FileActions file={file} /></ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </section>
  )
}
