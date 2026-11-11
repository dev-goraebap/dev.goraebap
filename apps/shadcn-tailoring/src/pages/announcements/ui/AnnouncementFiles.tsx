import { useId } from "react"
import { sizeText, type AnnouncementFile } from "@/entities/announcement"
import { Button } from "@/shared/ui/button"
import { DownloadIcon, FileIcon, ImageIcon } from "@/shared/ui/icon"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/shared/ui/item"
import { toast } from "@/shared/ui/toast"

/** 모의 데이터라 실제 파일이 없다. 내려받기는 무엇을 받았을지 알리기만 한다. */
const download = (file: AnnouncementFile) =>
  toast.add({ type: "info", title: `${file.name}`, description: "예시 공지라 내려받을 파일이 없습니다." })

/** 공지 첨부(호호코워크 ReadingPart + FileList): "첨부 N개" 소제목 아래 이름 · 크기 · 내려받기 줄. */
export function AnnouncementFiles({ files }: { files: AnnouncementFile[] }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 pt-2">
      <h2 id={titleId} className="text-base font-semibold">첨부 {files.length}개</h2>
      <ItemGroup aria-label="공지 첨부" className="gap-0 squircle rounded-xl border bg-card">
        {files.map(file => (
          <Item key={file.id} role="listitem" variant="outline" size="sm" className="rounded-none border-0 not-last:border-b">
            <ItemMedia variant="icon">{file.isImage ? <ImageIcon /> : <FileIcon />}</ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="truncate">{file.name}</ItemTitle>
              <ItemDescription>{sizeText(file.size)}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon-sm" aria-label={`${file.name} 내려받기`} title="내려받기" onClick={() => download(file)}>
                <DownloadIcon />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </section>
  )
}
