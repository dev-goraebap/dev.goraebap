import { useId, useRef, useState, type DragEvent } from "react"
import { cn } from "@/shared/lib/utils"
import { UploadIcon } from "@/shared/ui/icon"
import { fileSizeText } from "./files"

/**
 * 받는 형식인지. accept는 input의 accept와 같은 꼴이다: 확장자(.png), 형식 묶음(image/*), 정확한 MIME(application/pdf).
 * 끌어다 놓은 파일은 브라우저가 accept로 거르지 않으므로 여기서 다시 본다.
 */
function isAccepted(file: File, accept: string | undefined, maxBytes: number | undefined) {
  if (file.size === 0 || (maxBytes !== undefined && file.size > maxBytes)) return false
  const formats = accept?.toLowerCase().split(",").map(format => format.trim()).filter(Boolean)
  if (!formats?.length) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return formats.some(format => format.startsWith(".") ? name.endsWith(format)
    : format.endsWith("/*") ? type.startsWith(format.slice(0, -1)) : type === format)
}

/**
 * 파일을 끌어다 놓거나 눌러 고르는 자리(호호코워크 FileDropzone). 끌어 오는 동안 테두리가 진해지고 "여기에 놓으세요"가 된다.
 * 형식이나 크기가 맞지 않는 파일은 빼고 그 이름을 알린다. 하나만 받는 곳에 여럿을 놓으면 받지 않는다.
 * 무엇을 받는지(hint)가 없으면 크기 한도만 적는다. 고른 파일을 들고 있는 것은 부르는 쪽이다(onPick).
 */
export function FileDropzone({ label, hint, accept, maxBytes, isMultiple = false, isDisabled, onPick }: {
  /** 자리의 이름: "파일 추가", "사진 추가". */
  label: string
  /** 받는 형식과 크기의 안내: "JPG, PNG · 장당 최대 10 MB". */
  hint?: string
  accept?: string
  /** 파일 하나의 최대 크기(바이트). */
  maxBytes?: number
  isMultiple?: boolean
  isDisabled?: boolean
  onPick: (files: File[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [isDragging, setDragging] = useState(false)
  const [problem, setProblem] = useState<string>()
  const about = hint ?? (maxBytes ? `파일당 최대 ${fileSizeText(maxBytes)}` : undefined)
  const choose = (files: File[]) => {
    if (isDisabled || files.length === 0) return
    if (!isMultiple && files.length > 1) return setProblem("파일은 한 번에 하나만 골라 주세요.")
    const valid = files.filter(file => isAccepted(file, accept, maxBytes))
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
    <div data-slot="file-dropzone" className="flex flex-col gap-2">
      <button type="button" aria-label={label} aria-describedby={about ? hintId : undefined} disabled={isDisabled} data-dragging={isDragging || undefined}
        onClick={() => input.current?.click()} onDragOver={over}
        onDragLeave={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
        onDrop={event => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)) }}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-input bg-muted/50 px-4 py-5 text-center outline-none",
          "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
          "data-dragging:border-ring data-dragging:bg-muted",
        )}>
        <UploadIcon className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{isDragging ? "여기에 놓으세요" : "파일을 끌어다 놓거나 눌러서 고르세요"}</span>
        {about && <span id={hintId} className="text-xs text-muted-foreground">{about}</span>}
      </button>
      <input ref={input} type="file" hidden aria-hidden tabIndex={-1} accept={accept} multiple={isMultiple} disabled={isDisabled}
        onChange={event => { choose(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = "" }} />
      {problem && <p role="alert" className="text-xs text-destructive">{problem}</p>}
    </div>
  )
}
