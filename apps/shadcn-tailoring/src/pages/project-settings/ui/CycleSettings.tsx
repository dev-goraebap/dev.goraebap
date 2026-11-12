import { useCurrentProject } from "@/entities/project"
import { cycleState, dayWithWeekday, today, useCycles, useSaveCycleSettings, type CycleSettings as Settings } from "@/entities/cycle"
import { RepeatIcon } from "@/shared/ui/icon"
import { PageState } from "@/shared/ui/page-state"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { SettingsRow, SettingsSection } from "@/shared/ui/settings"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/toast"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

type Option = { value: string; label: string }

const WEEKS: Option[] = [1, 2, 3, 4, 6, 8].map(weeks => ({ value: String(weeks), label: `${weeks}주` }))
const WEEKDAYS: Option[] = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"].map((name, index) => ({ value: String(index + 1), label: name }))
const UPCOMING: Option[] = [0, 1, 2, 3, 4, 6].map(count => ({ value: String(count), label: count === 0 ? "만들지 않음" : `${count}개` }))

const DESCRIPTION = "정한 기간으로 업무를 묶어 리듬을 만듭니다. 기간이 끝나면 남은 업무를 다음 사이클로 넘기고, 다음 사이클을 미리 만들어 둡니다."

function CycleSelect({ label, options, value, disabled, onChange }: {
  label: string; options: Option[]; value: string; disabled: boolean; onChange: (value: string) => void
}) {
  return (
    <Select items={options} value={value} disabled={disabled} onValueChange={next => next !== null && onChange(next)}>
      <SelectTrigger aria-label={label} className="min-w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/**
 * 프로젝트 설정 · 사이클(호호코워크 project-settings ProjectCyclesPage, 리니어 Cycle settings): 사이클을 쓸지, 한 사이클의 길이와
 * 시작 요일, 미리 만들 개수, 진행 중 · 완료가 된 업무를 지금 사이클에 넣을지. 바꾸면 바로 저장하고 알린다.
 * 켜면 설정대로 모자란 사이클(지금 것과 미리 만들 것)이 바로 생긴다. 꺼져 있으면 일정 · 자동 넣기는 고를 수 없다.
 */
export function CycleSettings() {
  const { key } = useCurrentProject()
  const cycles = useCycles(key)
  const save = useSaveCycleSettings(key)
  const settings = cycles.data?.settings

  const body = () => {
    if (cycles.isError) return <PageState kind="error" isCompact title="사이클 설정을 불러오지 못했습니다" description={cycles.error.message} />
    if (!settings) return null
    const isOff = !settings.isEnabled
    const change = (patch: Partial<Settings>) => save.mutate({ ...settings, ...patch }, {
      onSuccess: () => toast.add({
        type: "success", title: "사이클 설정을 저장했습니다",
        description: patch.isEnabled === true ? "설정한 기간대로 사이클을 만들었습니다." : patch.isEnabled === false ? "새 사이클을 더 만들지 않습니다." : undefined,
      }),
      onError: error => toast.add({ type: "error", title: "저장하지 못했습니다", description: error.message }),
    })
    const on = today()
    const next = cycles.data?.cycles.find(cycle => cycleState(cycle, on) === "upcoming")
    return (
      <>
        <SettingsSection title="사용">
          <SettingsRow label="사이클 쓰기" description="속도(처리량)를 보려면 업무에 스토리 포인트나 추정시간을 함께 남기세요.">
            <Switch aria-label="사이클 쓰기" checked={settings.isEnabled} onCheckedChange={isEnabled => change({ isEnabled })} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="일정">
          <SettingsRow wide label="사이클 기간">
            <CycleSelect label="사이클 기간" options={WEEKS} value={String(settings.weeks)} disabled={isOff} onChange={value => change({ weeks: Number(value) })} />
          </SettingsRow>
          <SettingsRow wide label="시작 요일" description={!isOff && next ? `다음 사이클은 ${dayWithWeekday(next.startDate)}에 시작합니다.` : undefined}>
            <CycleSelect label="시작 요일" options={WEEKDAYS} value={String(settings.startDay)} disabled={isOff} onChange={value => change({ startDay: Number(value) })} />
          </SettingsRow>
          <SettingsRow wide label="미리 만들 사이클" description="진행 중인 사이클 다음에 몇 개를 미리 만들어 둘지 정합니다.">
            <CycleSelect label="미리 만들 사이클" options={UPCOMING} value={String(settings.upcoming)} disabled={isOff} onChange={value => change({ upcoming: Number(value) })} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="자동으로 넣기" note="상태가 바뀔 때 사이클이 없는 업무를 진행 중인 사이클에 넣습니다.">
          <SettingsRow label="진행 중이 된 업무" description="업무를 진행 중으로 옮기면 지금 사이클에 넣습니다.">
            <Switch aria-label="진행 중이 된 업무" checked={settings.addsStarted} disabled={isOff} onCheckedChange={addsStarted => change({ addsStarted })} />
          </SettingsRow>
          <SettingsRow label="완료된 업무" description="업무를 완료하면 지금 사이클에 넣습니다.">
            <Switch aria-label="완료된 업무" checked={settings.addsCompleted} disabled={isOff} onCheckedChange={addsCompleted => change({ addsCompleted })} />
          </SettingsRow>
        </SettingsSection>
      </>
    )
  }

  return (
    <ProjectSettingsFrame label="사이클" icon={RepeatIcon}>
      {/* 화면 설정(SettingsPage)과 같은 가운데 한 열. 페이지 틀은 ProjectSettingsFrame이 그리므로 안쪽만 둔다. */}
      <main className="flex justify-center px-4 py-10">
        <div className="flex w-full max-w-180 min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">사이클</h1>
            <p className="text-muted-foreground">{DESCRIPTION}</p>
          </header>
          {body()}
        </div>
      </main>
    </ProjectSettingsFrame>
  )
}
