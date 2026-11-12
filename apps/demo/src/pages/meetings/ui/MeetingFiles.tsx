import { useId } from "react"
import { sizeText, type Meeting, type MeetingFile } from "@/entities/meeting"
import { Button } from "@/shared/ui/button"
import { DownloadIcon, FileIcon, ImageIcon, MicrophoneIcon, SquareArrowOutUpRightIcon } from "@/shared/ui/icon"

/** 파일 하나의 열기 · 내려받기. 이 브라우저 안의 주소(object URL)라 새 탭에서 열고, download로 원래 이름 그대로 받는다. */
function FileActions({ file }: { file: MeetingFile & { url: string } }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <Button variant="ghost" size="icon-sm" nativeButton={false} aria-label={`${file.name} 열기`} title="열기" className="max-md:size-11"
        render={<a href={file.url} target="_blank" rel="noreferrer" />}>
        <SquareArrowOutUpRightIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" nativeButton={false} aria-label={`${file.name} 내려받기`} title="내려받기" className="max-md:size-11"
        render={<a href={file.url} download={file.name} />}>
        <DownloadIcon />
      </Button>
    </span>
  )
}

/** 파일 줄: 표식(사진이면 미리보기) · 이름 · 크기 · 열기 · 내려받기. */
function FileRow({ file }: { file: MeetingFile }) {
  const isImage = file.type.startsWith("image/")
  return (
    <li className="flex min-h-12 items-center gap-3 px-3 py-2 not-last:border-b">
      {isImage && file.url
        ? <img src={file.url} alt="" className="size-9 shrink-0 rounded-md object-cover" />
        : <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">{isImage ? <ImageIcon /> : file.type.startsWith("audio/") ? <MicrophoneIcon /> : <FileIcon />}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{file.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{sizeText(file.size)}</span>
      </span>
      {file.url && <FileActions file={{ ...file, url: file.url }} />}
    </li>
  )
}

/** 소제목과 파일 목록(호호코워크 ReadingPart + FileList). */
function FilePart({ title, files }: { title: string; files: MeetingFile[] }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 pt-2">
      <h2 id={titleId} className="text-base font-semibold">{title}</h2>
      <ul aria-label={title} className="flex flex-col squircle rounded-xl border bg-card">
        {files.map(file => <FileRow key={file.id} file={file} />)}
      </ul>
    </section>
  )
}

/**
 * 회의록에 붙은 파일(호호코워크 MeetingPage의 회의 사진 · 녹음): 사진은 "회의 사진 N장" 아래 줄로, 녹음은 이 브라우저에서
 * 만든 것이면 열고 받을 수 있는 줄, 예시 회의록처럼 파일이 없으면 이름만 한 줄로 알린다(받아쓴 뒤 녹음을 지운 호호코워크처럼).
 */
export function MeetingFiles({ meeting }: { meeting: Meeting }) {
  const { audio, photos } = meeting
  return (
    <>
      {photos.length > 0 && <FilePart title={`회의 사진 ${photos.length}장`} files={photos} />}
      {audio?.url && <FilePart title="회의 녹음" files={[audio]} />}
      {audio && !audio.url && (
        <p className="text-xs text-muted-foreground">
          녹음: {audio.name}{meeting.status === "completed" ? " · 받아쓴 뒤 녹음 파일은 지웠습니다." : ""}
        </p>
      )}
    </>
  )
}
