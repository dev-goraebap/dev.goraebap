import { closeHistory } from "@tiptap/pm/history"
import { NodeSelection, type SelectionBookmark, type Transaction } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { PaperclipIcon, RefreshCwIcon, XIcon } from "@/shared/ui/icon"
import { Progress } from "@/shared/ui/progress"
import type { UploadFile } from "./types"

type Job = { id: string; batch: string; file: File; state: "queued" | "uploading" | "failed"; progress: number; error: string; controller: AbortController; bookmark: SelectionBookmark }

/**
 * 올리기 줄: 고른 파일을 하나씩 올리고, 다 올라가면 고를 때의 자리에 파일 블록을 넣는다. 진행 · 실패 · 다시 시도 · 취소를 본문 위
 * 줄에 보인다. 올리는 동안 창을 닫으려 하면 브라우저가 묻는다.
 */
export function useUploads(editor: Editor | null, upload: UploadFile) {
  const pipeline = useRef(Promise.resolve())
  const jobs = useRef(new Map<string, Job>()), alive = useRef(true), [, refresh] = useState(0)
  const draw = () => { if (alive.current) refresh(n => n + 1) }
  useEffect(() => {
    alive.current = true
    if (!editor) return
    const map = ({ transaction }: { transaction: Transaction }) => { for (const job of jobs.current.values()) job.bookmark = job.bookmark.map(transaction.mapping) }
    const before = (event: BeforeUnloadEvent) => { if ([...jobs.current.values()].some(job => job.state !== "failed")) event.preventDefault() }
    editor.on("transaction", map); window.addEventListener("beforeunload", before)
    return () => {
      alive.current = false
      for (const job of jobs.current.values()) job.controller.abort()
      jobs.current.clear(); editor.off("transaction", map); window.removeEventListener("beforeunload", before)
    }
  }, [editor])
  async function run(job: Job) {
    if (!editor || editor.isDestroyed || !alive.current || !jobs.current.has(job.id)) return
    job.state = "uploading"; job.progress = 0; job.error = ""; job.controller = new AbortController(); draw()
    try {
      const asset = await upload(job.file, value => { job.progress = value; draw() }, job.controller.signal)
      if (!alive.current || editor.isDestroyed || !jobs.current.has(job.id)) return
      const position = job.bookmark.resolve(editor.state.doc).to, blockId = crypto.randomUUID()
      editor.view.dispatch(closeHistory(editor.state.tr))
      editor.commands.insertContentAt(position, { type: "media", attrs: { blockId, src: asset.url, name: asset.name, mime: asset.mime, size: asset.size ?? job.file.size,
        width: 100, color: asset.dominantColor ?? null, pixelWidth: asset.width ?? null, pixelHeight: asset.height ?? null } }, { updateSelection: false })
      editor.view.dispatch(closeHistory(editor.state.tr))
      // 같이 고른 다음 파일은 방금 넣은 블록 뒤에 이어 놓는다.
      let inserted: number | undefined
      editor.state.doc.descendants((node, pos) => { if (node.attrs.blockId === blockId) inserted = pos })
      if (inserted !== undefined) for (const next of jobs.current.values()) if (next.batch === job.batch && next.state === "queued") next.bookmark = NodeSelection.create(editor.state.doc, inserted).getBookmark()
      jobs.current.delete(job.id)
    } catch (error) {
      if ((error as Error).name === "AbortError") jobs.current.delete(job.id)
      else { job.state = "failed"; job.error = error instanceof Error ? error.message : "업로드하지 못했습니다" }
    }
    draw()
  }
  function enqueue(files: File[]) {
    if (!editor || !editor.isEditable) return
    const batch = crypto.randomUUID()
    for (const file of files) {
      const job: Job = { id: crypto.randomUUID(), batch, file, state: "queued", progress: 0, error: "", controller: new AbortController(), bookmark: editor.state.selection.getBookmark() }
      jobs.current.set(job.id, job)
      pipeline.current = pipeline.current.then(() => run(job))
      draw()
    }
  }
  const panel = jobs.current.size > 0 ? (
    <section aria-label="파일 업로드" className="mb-5 flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
      {[...jobs.current.values()].map(job => (
        <div key={job.id} className="flex items-center gap-3 px-3.5 py-3">
          <PaperclipIcon className="text-icon-muted" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{job.file.name}</span>
            {job.state !== "failed" ? <>
              <span role="status" className="text-xs text-muted-foreground">{job.state === "queued" ? "업로드 대기 중…" : job.progress === 100 ? "보관하는 중…" : `업로드 중 · ${job.progress}%`}</span>
              <Progress value={job.progress} aria-label={`${job.file.name} 업로드 진행`} />
            </> : <span role="alert" className="text-xs text-destructive">{job.error}</span>}
          </div>
          {job.state === "failed" ? (
            <Button variant="ghost" size="sm" aria-label={`${job.file.name} 다시 업로드`} className="max-md:h-11"
              onClick={() => { job.state = "queued"; pipeline.current = pipeline.current.then(() => run(job)); draw() }}>
              <RefreshCwIcon data-icon="inline-start" />재시도
            </Button>
          ) : null}
          <Button variant="ghost" size="icon-sm" aria-label={`${job.file.name} ${job.state !== "failed" ? "업로드 취소" : "업로드 닫기"}`} className="max-md:size-11"
            onClick={() => { job.controller.abort(); jobs.current.delete(job.id); draw() }}>
            <XIcon />
          </Button>
        </div>
      ))}
    </section>
  ) : null
  return { enqueue, panel, hasPending: jobs.current.size > 0 }
}
