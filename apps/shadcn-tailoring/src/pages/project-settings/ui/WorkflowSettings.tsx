import { useId, useState, type DragEvent, type KeyboardEvent } from "react"
import { useCurrentProject } from "@/entities/project"
import {
  CATEGORIES, COLUMN_NAME_MAX, WorkflowCategoryIcon, categoryMark, countInColumn, useDeleteWorkflowColumn, useOrderWorkflowColumns,
  useSaveWorkflowColumn, useWorkflow, useWorkItems, type ColumnCategory, type WorkflowColumn,
} from "@/entities/work-item"
import { cn } from "@/shared/lib/utils"
import { ActionMenu, type MenuAction } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Field, FieldLabel } from "@/shared/ui/field"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, CheckIcon, PencilIcon, PlusIcon, Trash2Icon, WorkflowIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { PageState } from "@/shared/ui/page-state"
import { SettingsSection } from "@/shared/ui/settings"
import { toast } from "@/shared/ui/toast"
import { FormDialog, SettingsBody } from "./GeneralParts"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/**
 * 프로젝트 설정의 워크플로(호호코워크 ProjectWorkflowPage): 업무가 거쳐 가는 상태(보드의 칸, 각각 다섯 분류 중 하나)를
 * 손잡이로 끌어 순서를 바꾸고, 더하고 고치고 지운다. 보관한 프로젝트는 읽기만 한다.
 * 칸은 업무 entity의 워크플로 캐시에 있어 여기서 고치면 보드 · 목록 · 필터 · 상태 고르기가 바로 따라온다.
 */
export function WorkflowSettings() {
  const { key, project } = useCurrentProject()
  const columns = useWorkflow(key)
  const body = () => {
    if (project === null) return <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" description="주소가 바뀌었거나 없는 프로젝트입니다." />
    if (!project || !columns.data) return null
    const canChange = project.status !== "archived"
    return (
      <SettingsBody title="워크플로"
        description={canChange ? "업무가 거쳐 가는 상태를 정합니다. 라벨과 업무 유형은 프로젝트 관리에서 모든 프로젝트에 함께 정합니다." : "보관한 프로젝트라 읽기만 할 수 있습니다."}>
        <Statuses projectKey={key} columns={columns.data} canChange={canChange} />
      </SettingsBody>
    )
  }
  return <ProjectSettingsFrame label="워크플로" icon={WorkflowIcon}>{body()}</ProjectSettingsFrame>
}

const moved = (ids: string[], id: string, to: number) => {
  const next = ids.filter(each => each !== id)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, id)
  return next
}

/** 보드 순서의 상태들. 줄마다 손잡이(끌기 · Alt+화살표), 분류 표식, 이름, 분류, 메뉴(수정 · 옮기기 · 삭제). */
function Statuses({ projectKey, columns, canChange }: { projectKey: string; columns: WorkflowColumn[]; canChange: boolean }) {
  const hintId = useId()
  const items = useWorkItems(projectKey)
  const save = useSaveWorkflowColumn(projectKey)
  const remove = useDeleteWorkflowColumn(projectKey)
  const order = useOrderWorkflowColumns(projectKey)
  const [editing, setEditing] = useState<WorkflowColumn | "new" | null>(null)
  const [deleting, setDeleting] = useState<WorkflowColumn | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  // 끄는 동안의 순서(놓으면 저장, Esc · 밖에 놓으면 버림).
  const [preview, setPreview] = useState<string[] | null>(null)
  const [said, setSaid] = useState("")

  const byId = new Map(columns.map(column => [column.id, column]))
  const ids = preview ?? columns.map(column => column.id)
  const shown = ids.map(id => byId.get(id)).filter((column): column is WorkflowColumn => !!column)

  const commit = (next: string[], id: string) => {
    order.mutate(next)
    const name = byId.get(id)?.name ?? ""
    setSaid(`${name} 상태를 ${next.indexOf(id) + 1}번째로 옮겼습니다.`)
  }
  const move = (id: string, by: number) => {
    const current = columns.map(column => column.id)
    const to = current.indexOf(id) + by
    if (to < 0 || to >= current.length) return
    commit(moved(current, id, to), id)
  }

  const dragStart = (event: DragEvent, id: string) => {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", id)
    const row = (event.currentTarget as HTMLElement).closest("li")
    if (row) event.dataTransfer.setDragImage(row, 16, 16)
    setDragging(id)
    setPreview(columns.map(column => column.id))
  }
  const dragOver = (event: DragEvent, overId: string) => {
    if (!dragging) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    if (overId !== dragging && preview) setPreview(moved(preview, dragging, preview.indexOf(overId)))
  }
  const dragEnd = (event: DragEvent) => {
    // 놓은 자리가 목록이면 dropEffect가 move다. Esc나 밖에 놓으면 none이라 처음 순서로 돌아간다.
    if (event.dataTransfer.dropEffect === "move" && dragging && preview) commit(preview, dragging)
    setDragging(null)
    setPreview(null)
  }
  const gripKey = (event: KeyboardEvent, id: string) => {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return
    event.preventDefault()
    move(id, event.key === "ArrowUp" ? -1 : 1)
  }

  const countOf = (column: WorkflowColumn) => countInColumn(items.data, column.id)
  const actionsOf = (column: WorkflowColumn, index: number): MenuAction[] => [
    { label: "수정", icon: PencilIcon, onSelect: () => setEditing(column) },
    ...(index > 0 ? [{ label: "위로 옮기기", icon: ArrowUpIcon, onSelect: () => move(column.id, -1) }] : []),
    ...(index < columns.length - 1 ? [{ label: "아래로 옮기기", icon: ArrowDownIcon, onSelect: () => move(column.id, 1) }] : []),
    { label: "삭제", icon: Trash2Icon, onSelect: () => setDeleting(column) },
  ]

  const deletingCount = deleting ? countOf(deleting) : 0
  const deleteBlock = !deleting ? undefined
    : columns.length <= 1 ? "마지막 상태는 삭제하지 않습니다. 다른 상태를 먼저 더해 주세요."
      : deletingCount > 0 ? `이 상태에 업무 ${deletingCount}건이 남아 있어 삭제하지 않습니다. 업무를 다른 상태로 먼저 옮겨 주세요.` : undefined

  return (
    <>
      <SettingsSection title="상태"
        note={canChange ? "끌어서 보드의 칸 순서를 바꿉니다. 분류는 완료 · 취소 여부와 업무 목록의 묶음에 쓰입니다." : undefined}
        action={canChange && (
          <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setEditing("new")}>
            <PlusIcon data-icon="inline-start" />상태 추가
          </Button>
        )}>
        <ul aria-label={canChange ? "상태 순서" : "상태"} className="flex flex-col divide-y divide-border">
          {shown.map((column, index) => (
            <li key={column.id} onDragOver={event => dragOver(event, column.id)} onDrop={event => event.preventDefault()}
              className={cn(
                "grid min-h-11 items-center gap-x-3 px-3",
                canChange ? "grid-cols-[1.25rem_1rem_minmax(0,1fr)_auto_2rem] pl-2 max-md:grid-cols-[2.75rem_1rem_minmax(0,1fr)_auto_2.75rem]"
                  : "grid-cols-[1rem_minmax(0,1fr)_auto]",
                dragging === column.id && "bg-muted opacity-60",
              )}>
              {canChange && (
                <button type="button" draggable aria-label={`${column.name} 옮기기`} aria-describedby={hintId}
                  onDragStart={event => dragStart(event, column.id)} onDragEnd={dragEnd} onKeyDown={event => gripKey(event, column.id)}
                  className="grid h-7 cursor-grab place-items-center rounded-md text-icon-muted outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing max-md:size-11">
                  <ArrowUpDownIcon className="size-4" />
                </button>
              )}
              <WorkflowCategoryIcon category={column.category} className="size-4" />
              <span className="truncate">{column.name}</span>
              <span className="truncate text-sm text-muted-foreground">{categoryMark(column.category).label}</span>
              {canChange && <ActionMenu size="row" label={`${column.name} 메뉴`} title={column.name} actions={actionsOf(column, index)} />}
            </li>
          ))}
        </ul>
      </SettingsSection>
      <p id={hintId} className="sr-only">끌어서 순서를 바꿉니다. 손잡이에서 Alt와 위아래 화살표도 쓸 수 있고, 끄는 동안 Esc는 취소입니다.</p>
      <p role="status" aria-live="polite" className="sr-only">{said}</p>

      {editing && (
        <ColumnDialog column={editing === "new" ? undefined : editing} isPending={save.isPending} onClose={() => setEditing(null)}
          onSave={(name, category) => save.mutate({ id: editing === "new" ? undefined : editing.id, name, category }, {
            onSuccess: () => {
              toast.add({ type: "success", title: editing === "new" ? "상태를 추가했습니다" : "상태를 고쳤습니다", description: name })
              setEditing(null)
            },
          })} />
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null) }}
        title={deleteBlock ? `${deleting?.name ?? ""} 상태를 삭제할 수 없습니다` : `${deleting?.name ?? ""} 상태를 삭제할까요?`}
        description={deleteBlock ?? "보드에서 이 칸이 사라집니다. 저장소 연동의 자동 이동 규칙이 이 상태를 골랐다면 보드 기본값으로 돌아갑니다."}
        action={deleteBlock ? undefined : {
          label: "삭제", isPending: remove.isPending,
          onAction: () => deleting && remove.mutate(deleting.id, {
            onSuccess: () => { toast.add({ type: "success", title: "상태를 삭제했습니다", description: deleting.name }); setDeleting(null) },
          }),
        }} />
    </>
  )
}

/** 상태 추가 · 수정: 이름과 분류. */
function ColumnDialog({ column, isPending, onSave, onClose }: {
  column?: WorkflowColumn; isPending: boolean; onSave: (name: string, category: ColumnCategory) => void; onClose: () => void
}) {
  const nameId = useId()
  const [name, setName] = useState(column?.name ?? "")
  const [category, setCategory] = useState<ColumnCategory>(column?.category ?? "STARTED")
  const categoryId = useId()
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose() }} title={column ? "상태 수정" : "상태 추가"}
      description="분류는 업무를 닫는지(완료 · 취소)와 목록의 묶음을 정합니다." submitLabel={column ? "저장" : "추가"}
      isSubmitDisabled={!name.trim()} isPending={isPending} onSubmit={() => onSave(name.trim(), category)}>
      <Field>
        <FieldLabel htmlFor={nameId}>이름</FieldLabel>
        <Input id={nameId} placeholder="예: 검토 중" value={name} autoFocus className="max-md:h-11"
          onChange={event => setName(event.target.value.slice(0, COLUMN_NAME_MAX))} />
      </Field>
      <Field>
        <FieldLabel id={categoryId}>분류</FieldLabel>
        {/* 다섯 개뿐이라 펼쳐 두고 고른다. 휴대폰 시트 안에서 또 뜨는 것을 만들지 않는다. */}
        <div role="radiogroup" aria-labelledby={categoryId} className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border">
          {CATEGORIES.map(each => (
            <button key={each.value} type="button" role="radio" aria-checked={each.value === category} onClick={() => setCategory(each.value)}
              className="flex h-9 items-center gap-2 px-3 text-left text-sm outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset aria-checked:bg-muted max-md:h-12 max-md:text-base">
              <WorkflowCategoryIcon category={each.value} className="size-4" />
              <span className="flex-1">{each.label}</span>
              {each.value === category && <CheckIcon className="size-4" />}
            </button>
          ))}
        </div>
      </Field>
    </FormDialog>
  )
}
