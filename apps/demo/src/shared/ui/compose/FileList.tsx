import { useEffect, useState, type ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { FileIcon, ImageIcon, XIcon, type Icon } from "@/shared/ui/icon"
import { fileKey, fileSizeText } from "./files"

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

/** 줄 앞의 표식: 사진이면 미리보기, 아니면 형식의 표식(기본은 파일). */
export function FileMark({ file, icon: Mark = FileIcon }: { file?: File; icon?: Icon }) {
  if (file?.type.startsWith("image/")) return <PhotoPreview file={file} />
  return <Mark className="size-8 shrink-0 p-1.5 text-muted-foreground" />
}

/**
 * 고른 파일 목록의 한 줄: 표식 · 이름 · 설명(크기, "저장하면 빠집니다") · 끝의 동작(빼기, 되돌리기).
 * FileList가 고른 File을 이 줄로 그리고, 이미 붙어 있던 파일처럼 File이 아닌 것은 부르는 쪽이 이 줄로 더한다.
 */
export function FileRow({ media, name, description, action }: { media: ReactNode; name: string; description: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex min-h-11 items-center gap-2.5 border-b py-1.5 last:border-b-0">
      {media}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{description}</span>
      </span>
      {action}
    </li>
  )
}

/** 줄 끝의 빼기. 휴대폰에서는 44px로 누른다. */
export function FileRemoveButton({ name, isDisabled, onClick }: { name: string; isDisabled?: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`${name} 빼기`} title="빼기" disabled={isDisabled} onClick={onClick} className="max-md:size-11">
      <XIcon />
    </Button>
  )
}

/**
 * 고른 파일 목록(호호코워크 compose의 파일 List): 줄마다 표식(사진이면 미리보기) · 이름 · 크기 · 빼기. 길면 안에서 스크롤한다.
 * children은 같은 목록 끝에 붙는 다른 줄(FileRow)이다. 고른 것도 더한 줄도 없으면 그리지 않는다.
 */
export function FileList({ label, files, icon, isDisabled, onRemove, children }: {
  /** 목록의 이름: "고른 회의 사진". */
  label: string
  files: File[]
  /** 사진이 아닌 파일의 표식. 기본은 파일. */
  icon?: Icon
  isDisabled?: boolean
  onRemove: (file: File) => void
  children?: ReactNode
}) {
  if (files.length === 0 && !children) return null
  return (
    <ul aria-label={label} className="flex max-h-[min(36dvh,17rem)] flex-col overflow-y-auto">
      {files.map(file => (
        <FileRow key={fileKey(file)} media={<FileMark file={file} icon={icon} />} name={file.name} description={fileSizeText(file.size)}
          action={<FileRemoveButton name={file.name} isDisabled={isDisabled} onClick={() => onRemove(file)} />} />
      ))}
      {children}
    </ul>
  )
}
