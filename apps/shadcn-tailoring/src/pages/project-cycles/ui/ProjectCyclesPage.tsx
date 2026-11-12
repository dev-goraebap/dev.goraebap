import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { CYCLE_STATES, cycleState, today, useCycles, useDeleteCycle, useSaveCycle, type Cycle, type CycleState } from "@/entities/cycle"
import { useCurrentProject } from "@/entities/project"
import { columnOf, isClosedCategory, useStatusColumns, useWorkItems, type WorkflowColumn, type WorkItem } from "@/entities/work-item"
import { paths, projectPath } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { CalendarIcon, CircleCheckIcon, PencilIcon, ProjectsIcon, RepeatIcon, SettingsIcon, Trash2Icon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { toast } from "@/shared/ui/toast"
import { CycleFormDialog } from "./CycleFormDialog"
import { CycleRow, type CycleTotals } from "./CycleRow"
import { FinishCycleDialog } from "./FinishCycleDialog"

/** 뜬 양식 하나. nonce는 열 때마다 양식의 칸을 새로 채우게 한다(닫히는 동안에는 같은 양식을 그대로 둔다). */
type Dialog = { kind: "edit"; cycle?: Cycle; nonce: number } | { kind: "finish"; cycle: Cycle; nonce: number } | { kind: "delete"; cycle: Cycle; nonce: number }

/** 리니어가 부르는 대로: 진행 중 · 다음(바로 다음 예정) · 계획(그 뒤 예정) · 기간 끝남 · 마침. */
const labelOf = (cycle: Cycle, state: CycleState, next?: Cycle) =>
  state === "upcoming" ? (cycle.id === next?.id ? "다음" : "계획") : CYCLE_STATES[state]

/** 완료율과 범위: 완료 분류의 칸이 끝낸 일, 취소 분류는 하지 않기로 한 일이라 범위에서 뺀다(리니어와 같이). */
function totalsOf(items: WorkItem[], columns: readonly WorkflowColumn[]): CycleTotals {
  const categories = items.map(item => columnOf(columns, item.status).category)
  const scope = categories.filter(category => category !== "CANCELED").length
  const done = categories.filter(category => category === "COMPLETED").length
  return { scope, done, ratio: scope ? done / scope : 0 }
}

/**
 * 프로젝트의 사이클(호호코워크 ProjectCyclesPage, 리니어 Cycles): 최근 사이클이 위로, 시작날 레일 위에 한 줄씩 진행 고리 ·
 * 상태(진행 중 · 다음 · 계획 · 마침) · 완료율 · 범위. 줄을 누르면 담긴 업무를 펼친다(진행 중인 사이클은 처음부터 펼침).
 * 줄 메뉴는 이름 · 목표 · 날짜 고치기, 예정 사이클 오늘 시작, 마치기(남은 업무 넘기기), 지우기. 돌리는 방식은 설정 · 사이클에서 정한다.
 * 완료율과 범위는 업무 캐시의 지금 상태로 센다(업무를 완료로 옮기면 바로 오른다).
 */
export function ProjectCyclesPage() {
  const { key, project } = useCurrentProject()
  const cycles = useCycles(key)
  const workItems = useWorkItems(key)
  const columns = useStatusColumns(key)
  const saveCycle = useSaveCycle(key)
  const deleteCycle = useDeleteCycle(key)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [opened, setOpened] = useState<Record<string, boolean>>({})

  const list = cycles.data?.cycles ?? []
  const settingsHref = projectPath(key, "settings/cycles")
  const byKey = new Map((workItems.data ?? []).map(item => [item.key, item]))
  const itemsOf = (cycle: Cycle) => cycle.workItemKeys.flatMap(itemKey => byKey.get(itemKey) ?? [])
  const on = today()
  const next = list.find(cycle => cycleState(cycle, on) === "upcoming")

  const open = (change: Omit<Dialog, "nonce">) => {
    setDialog({ ...change, nonce: (dialog?.nonce ?? 0) + 1 } as Dialog)
    setDialogOpen(true)
  }
  const startToday = (cycle: Cycle) => saveCycle.mutate(
    { id: cycle.id, input: { name: cycle.name, goal: cycle.goal, startDate: on, endDate: cycle.endDate } },
    {
      onSuccess: () => toast.add({ type: "success", title: "사이클을 오늘 시작했습니다", description: cycle.name }),
      onError: error => toast.add({ type: "error", title: "시작하지 못했습니다", description: error.message }),
    },
  )
  const remove = (cycle: Cycle) => deleteCycle.mutate(cycle.id, {
    onSuccess: () => {
      toast.add({ type: "success", title: "사이클을 지웠습니다", description: cycle.name })
      setDialogOpen(false)
    },
  })

  const body = () => {
    if (cycles.isError) return <PageState kind="error" title="사이클을 불러오지 못했습니다" description={cycles.error.message} />
    if (!cycles.data) return null
    if (list.length === 0) {
      const isEnabled = cycles.data.settings.isEnabled
      return (
        <PageState kind="empty" title="아직 사이클이 없습니다"
          description={isEnabled ? "새 사이클을 만들어 기간을 정해 보세요."
            : "설정 · 사이클에서 사이클을 켜면 정한 기간마다 사이클이 만들어지고, 남은 업무가 다음 사이클로 넘어갑니다."}
          action={isEnabled
            ? <Button variant="outline" onClick={() => open({ kind: "edit" })}>새 사이클</Button>
            : <Button variant="outline" nativeButton={false} render={<Link to={settingsHref} />}>사이클 설정</Button>} />
      )
    }
    const rows = [...list].reverse()
    return (
      <ul aria-label="사이클" className="flex flex-col py-2">
        {rows.map((cycle, index) => {
          const state = cycleState(cycle, on)
          const items = itemsOf(cycle)
          return (
            <CycleRow key={cycle.id} cycle={cycle} state={state} label={labelOf(cycle, state, next)} totals={totalsOf(items, columns)} items={items} columns={columns}
              isFirst={index === 0} isOpen={opened[cycle.id] ?? state === "current"}
              onToggle={() => setOpened(old => ({ ...old, [cycle.id]: !(old[cycle.id] ?? state === "current") }))}
              actions={[
                { label: "이름·목표·날짜 바꾸기", icon: PencilIcon, onSelect: () => open({ kind: "edit", cycle }) },
                ...(state === "upcoming" ? [{ label: "오늘 시작", icon: CalendarIcon, onSelect: () => startToday(cycle) }] : []),
                ...(state !== "completed" ? [{ label: "사이클 마치기", icon: CircleCheckIcon, onSelect: () => open({ kind: "finish", cycle }) }] : []),
                { label: "지우기", icon: Trash2Icon, onSelect: () => open({ kind: "delete", cycle }) },
              ]} />
          )
        })}
      </ul>
    )
  }

  return (
    <Page
      crumbs={[{ label: "프로젝트", href: paths.projects }, { label: project?.name ?? key, icon: ProjectsIcon, href: projectPath(key) }, { label: "사이클", icon: RepeatIcon }]}
      actions={
        <Button variant="ghost" size="icon" aria-label="사이클 설정" title="사이클 설정" nativeButton={false} render={<Link to={settingsHref} />}>
          <SettingsIcon />
        </Button>
      }
      create={{ label: "새 사이클", onClick: () => open({ kind: "edit" }) }}
    >
      {body()}
      {dialog?.kind === "edit" && (
        <CycleFormDialog key={dialog.nonce} projectKey={key} cycle={dialog.cycle} cycles={list} open={isDialogOpen} onOpenChange={setDialogOpen} />
      )}
      {dialog?.kind === "finish" && (
        <FinishCycleDialog key={dialog.nonce} projectKey={key} cycle={dialog.cycle} cycles={list} open={isDialogOpen} onOpenChange={setDialogOpen}
          unfinished={itemsOf(dialog.cycle).filter(item => !isClosedCategory(columnOf(columns, item.status).category)).map(item => item.key)} />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog open={isDialogOpen} onOpenChange={setDialogOpen} title={`'${dialog.cycle.name}' 사이클을 지울까요?`}
          description="업무는 지우지 않고 사이클에서만 뺍니다."
          action={{ label: "지우기", onAction: () => remove(dialog.cycle), isPending: deleteCycle.isPending }} />
      )}
    </Page>
  )
}
