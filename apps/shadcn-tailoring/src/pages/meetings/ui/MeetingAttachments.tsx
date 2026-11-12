import { useEffect, useId, useRef, useState, type DragEvent } from "react"
import { sizeText } from "@/entities/meeting"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ArchiveUpIcon, FileIcon, ImageIcon, XIcon } from "@/shared/ui/icon"
import { PropertyPill } from "@/shared/ui/property-pill"

const MB = 1024 * 1024

/** 회의 녹음은 하나, 회의 사진은 여러 장(호호코워크 MeetingAttachments). 형식과 크기는 호호코워크 서버가 받는 그대로다. */
const KINDS = {
  audio: { label: "회의 녹음", accept: ".mp3,.m4a,.mp4,.wav,.ogg,.webm,.aac", maxBytes: 500 * MB, hint: "MP3, M4A, MP4, WAV, OGG, WebM, AAC · 최대 500 MB" },
  photo: { label: "회의 사진", accept: ".jpg,.jpeg,.png,.webp,.gif", maxBytes: 10 * MB, hint: "JPG, PNG, WebP, GIF · 장당 최대 10 MB" },
} as const

/** 같은 파일을 두 번 고르면 하나만 남긴다. */
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

/** 고른 파일 중 형식(확장자)과 크기가 맞는 것. */
function accepted(files: File[], accept: string, maxBytes: number) {
  const formats = accept.split(",")
  return files.filter(file => file.size > 0 && file.size <= maxBytes && formats.some(format => file.name.toLowerCase().endsWith(format)))
}

/**
 * 파일을 끌어다 놓거나 눌러 고르는 자리(호호코워크 FileDropzone). 끌어 오는 동안 테두리가 진해지고 "여기에 놓으세요"가 된다.
 * 형식이나 크기가 맞지 않는 파일은 빼고 그 이름을 알린다. 하나만 받는 곳에 여럿을 놓으면 받지 않는다.
 */
function FileDropzone({ label, hint, accept, maxBytes, isMultiple, isDisabled, onPick }: {
  label: string; hint: string; accept: string; maxBytes: number; isMultiple: boolean; isDisabled?: boolean; onPick: (files: File[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [isDragging, setDragging] = useState(false)
  const [problem, setProblem] = useState<string>()
  const choose = (files: File[]) => {
    if (isDisabled || files.length === 0) return
    if (!isMultiple && files.length > 1) return setProblem("파일은 한 번에 하나만 골라 주세요.")
    const valid = accepted(files, accept, maxBytes)
    const invalid = files.filter(file => !valid.includes(file))
    setProblem(invalid.length > 0 ? `${invalid.map(file => file.name).join(", ")} 파일의 형식이나 크기를 확인해 주세요.` : undefined)
    if (valid.length > 0) onPick(valid)
  }
  const over = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = isDisabled ? "none" : "copy"
    if (!isDisabled) setDragging(true)
  }
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-label={label} aria-describedby={hintId} disabled={isDisabled} data-dragging={isDragging || undefined}
        onClick={() => input.current?.click()} onDragOver={over}
        onDragLeave={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
        onDrop={event => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)) }}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-input bg-muted/50 px-4 py-5 text-center outline-none",
          "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
          "data-dragging:border-ring data-dragging:bg-muted",
        )}>
        <ArchiveUpIcon className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{isDragging ? "여기에 놓으세요" : "파일을 끌어다 놓거나 눌러서 고르세요"}</span>
        <span id={hintId} className="text-xs text-muted-foreground">{hint}</span>
      </button>
      <input ref={input} type="file" hidden aria-hidden tabIndex={-1} accept={accept} multiple={isMultiple} disabled={isDisabled}
        onChange={event => { choose(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = "" }} />
      {problem && <p role="alert" className="text-xs text-destructive">{problem}</p>}
    </div>
  )
}

/** 사진의 작은 미리보기. 이 브라우저 안의 주소를 만들어 보이고, 사라질 때 놓는다. */
function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const preview = URL.createObjectURL(file)
    setUrl(preview)
    return () => URL.revokeObjectURL(preview)
  }, [file])
  return url ? <img src={url} alt="" className="size-8 shrink-0 rounded-md object-cover" /> : <ImageIcon className="size-8 shrink-0 p-1.5 text-muted-foreground" />
}

/**
 * 회의 녹음 · 회의 사진 알약(호호코워크 MeetingAttachment). 비면 이름, 고르면 녹음은 파일 이름, 사진은 "회의 사진 N장".
 * 누르면 고르는 자리와 고른 파일 목록(표식 · 이름 · 크기 · 빼기)이 뜬다(데스크톱 팝오버, 휴대폰 바텀시트).
 * 파일은 서버에 올리지 않고 만들 때까지 이 양식이 File로 들고 있다.
 */
export function MeetingAttachment({ kind, files, onChange, isDisabled }: {
  kind: keyof typeof KINDS
  files: File[]
  onChange: (files: File[]) => void
  isDisabled?: boolean
}) {
  const isSingle = kind === "audio"
  const { label, accept, maxBytes, hint } = KINDS[kind]
  const Mark = isSingle ? FileIcon : ImageIcon
  const add = (added: File[]) => {
    if (isSingle) return onChange(added)
    const unique = new Map(files.map(file => [fileKey(file), file]))
    for (const file of added) if (!unique.has(fileKey(file))) unique.set(fileKey(file), file)
    onChange([...unique.values()])
  }
  const text = files.length === 0 ? undefined : isSingle ? files[0].name : `${label} ${files.length}장`
  return (
    <PropertyPill label={label} icon={<Mark />} text={text} width="w-88">
      {() => (
        <div className="flex flex-col gap-2 p-1">
          <FileDropzone label={isSingle ? (files.length > 0 ? "녹음 파일 바꾸기" : "녹음 파일 추가") : "사진 추가"} hint={hint}
            accept={accept} maxBytes={maxBytes} isMultiple={!isSingle} isDisabled={isDisabled} onPick={add} />
          {files.length > 0 && (
            <ul aria-label={`고른 ${label}`} className="flex max-h-[min(36dvh,17rem)] flex-col overflow-y-auto">
              {files.map(file => (
                <li key={fileKey(file)} className="flex min-h-11 items-center gap-2.5 border-b py-1.5 last:border-b-0">
                  {isSingle ? <FileIcon className="size-8 shrink-0 p-1.5 text-muted-foreground" /> : <PhotoPreview file={file} />}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{sizeText(file.size)}</span>
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label={`${file.name} 빼기`} title="빼기" disabled={isDisabled}
                    onClick={() => onChange(files.filter(each => each !== file))} className="max-md:size-11">
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PropertyPill>
  )
}
