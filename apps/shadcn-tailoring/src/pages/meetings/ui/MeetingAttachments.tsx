import { FileDropzone, FileList, MB, mergeFiles } from "@/shared/ui/compose"
import { FileIcon, ImageIcon } from "@/shared/ui/icon"
import { PropertyPill } from "@/shared/ui/property-pill"

/** 회의 녹음은 하나, 회의 사진은 여러 장(호호코워크 MeetingAttachments). 형식과 크기는 호호코워크 서버가 받는 그대로다. */
const KINDS = {
  audio: { label: "회의 녹음", accept: ".mp3,.m4a,.mp4,.wav,.ogg,.webm,.aac", maxBytes: 500 * MB, hint: "MP3, M4A, MP4, WAV, OGG, WebM, AAC · 최대 500 MB" },
  photo: { label: "회의 사진", accept: ".jpg,.jpeg,.png,.webp,.gif", maxBytes: 10 * MB, hint: "JPG, PNG, WebP, GIF · 장당 최대 10 MB" },
} as const

/**
 * 회의 녹음 · 회의 사진 알약(호호코워크 MeetingAttachment). 비면 이름, 고르면 녹음은 파일 이름, 사진은 "회의 사진 N장".
 * 누르면 고르는 자리와 고른 파일 목록(표식 · 이름 · 크기 · 빼기)이 뜬다(데스크톱 팝오버, 휴대폰 바텀시트).
 * 녹음은 새로 고르면 바꾸고, 사진은 이어 붙인다. 파일은 서버에 올리지 않고 만들 때까지 이 양식이 File로 들고 있다.
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
  const text = files.length === 0 ? undefined : isSingle ? files[0].name : `${label} ${files.length}장`
  return (
    <PropertyPill label={label} icon={<Mark />} text={text} width="w-88">
      {() => (
        <div className="flex flex-col gap-2 p-1">
          <FileDropzone label={isSingle ? (files.length > 0 ? "녹음 파일 바꾸기" : "녹음 파일 추가") : "사진 추가"} hint={hint}
            accept={accept} maxBytes={maxBytes} isMultiple={!isSingle} isDisabled={isDisabled}
            onPick={added => onChange(isSingle ? added : mergeFiles(files, added))} />
          <FileList label={`고른 ${label}`} files={files} isDisabled={isDisabled} onRemove={file => onChange(files.filter(each => each !== file))} />
        </div>
      )}
    </PropertyPill>
  )
}
