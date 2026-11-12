import { useId, useState } from "react"
import {
  PROJECT_COLORS, PROJECT_ICONS, PROJECT_KEY, ProjectMark, useCurrentProject, useProjects, useUpdateProject, type Project,
} from "@/entities/project"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/ui/field"
import { InfoIcon, SettingsIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { PageState } from "@/shared/ui/page-state"
import { SettingsRow, SettingsSection } from "@/shared/ui/settings"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/toast"
import {
  DESCRIPTION_MAX, NAME_MAX, draftOf, useGeneralState, useSaveGeneral, useSetDeleted, type GeneralDraft, type GeneralState,
} from "../model/general"
import { FormDialog, SettingsBody } from "./GeneralParts"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 프로젝트 설정의 일반(호호코워크 ProjectGeneralPage): 표식 · 이름 · 키 · 설명을 함께 저장하고, 그 아래 위험 구역. */
export function GeneralSettings() {
  const { project } = useCurrentProject()
  const state = useGeneralState(project)
  const body = () => {
    if (project === null) return <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" description="주소가 바뀌었거나 없는 프로젝트입니다." />
    if (!project || !state.data) return null
    return (
      <SettingsBody title="일반" description="프로젝트 정보와 보관 상태를 관리합니다.">
        {/* 양식은 프로젝트에서 한 번 시작한다. 다른 곳의 변경이 적고 있는 것을 덮지 않는다. */}
        <GeneralForm key={project.id} project={project} state={state.data} />
        <DangerZone project={project} state={state.data} />
      </SettingsBody>
    )
  }
  return <ProjectSettingsFrame label="일반" icon={SettingsIcon}>{body()}</ProjectSettingsFrame>
}

/** 표식 고르기(호호코워크 MarkNameField의 표식): 아이콘과 색. 데스크톱은 팝오버, 휴대폰은 바텀시트. */
function MarkPicker({ icon, color, isDisabled, onChange }: {
  icon: GeneralDraft["icon"]; color: string; isDisabled: boolean; onChange: (mark: Pick<GeneralDraft, "icon" | "color">) => void
}) {
  const choice = "max-md:size-11 aria-pressed:bg-muted aria-pressed:ring-2 aria-pressed:ring-ring"
  return (
    <AdaptivePopover title="프로젝트 표식" className="w-60 p-3"
      trigger={
        <Button variant="outline" size="icon" aria-label="프로젝트 표식 바꾸기" disabled={isDisabled} className="max-md:size-11">
          <ProjectMark icon={icon} color={color} size="sm" />
        </Button>
      }>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">아이콘</p>
          <div className="grid grid-cols-5 gap-1 max-md:grid-cols-6">
            {PROJECT_ICONS.map(each => (
              <Button key={each.value} variant="ghost" size="icon" aria-label={each.label} aria-pressed={each.value === icon} className={choice}
                onClick={() => onChange({ icon: each.value, color })}>
                <ProjectMark icon={each.value} color={color} size="sm" />
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">색</p>
          <div className="grid grid-cols-5 gap-1 max-md:grid-cols-6">
            {PROJECT_COLORS.map(each => (
              <Button key={each.value} variant="ghost" size="icon" aria-label={each.label} aria-pressed={each.value === color} className={choice}
                onClick={() => onChange({ icon, color: each.value })}>
                <ProjectMark icon={icon} color={each.value} size="sm" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </AdaptivePopover>
  )
}

/**
 * 프로젝트 정보를 한 양식으로 저장한다. 다른 프로젝트가 쓰는 키면 키 아래에 말한다. 보관 · 삭제한 프로젝트는 읽기만 한다.
 * 호호코워크는 키를 바꾸면 새 주소로 옮기지만, 이 앱은 프로젝트 목록을 바꾸지 않으므로 주소는 그대로다.
 */
function GeneralForm({ project, state }: { project: Project; state: GeneralState }) {
  const nameId = useId()
  const keyId = useId()
  const descriptionId = useId()
  const projects = useProjects()
  const takenKeys = (projects.data ?? []).filter(each => each.id !== project.id).map(each => each.key)
  const save = useSaveGeneral(project.id, takenKeys)
  const [draft, setDraft] = useState(() => draftOf(state))
  const [isChecked, setChecked] = useState(false)
  const isReadOnly = project.status === "archived" || state.isDeleted
  const isChanged = JSON.stringify(draftOf(state)) !== JSON.stringify(draft)
  const nameError = isChecked && !draft.name.trim() ? "프로젝트 이름을 입력해 주세요." : undefined
  const keyError = isChecked && !PROJECT_KEY.test(draft.key) ? "키는 영문 대문자 · 숫자 2~10자로 적어 주세요."
    : save.error ? save.error.message : undefined
  const change = (patch: Partial<GeneralDraft>) => {
    if (save.error) save.reset()
    setDraft(current => ({ ...current, ...patch }))
  }
  const submit = () => {
    setChecked(true)
    if (isReadOnly || !draft.name.trim() || !PROJECT_KEY.test(draft.key)) return
    const next = { ...draft, name: draft.name.trim(), description: draft.description.trim() }
    save.mutate(next, {
      onSuccess: saved => {
        setChecked(false)
        setDraft(saved)
        toast.add({ type: "success", title: "변경을 저장했습니다", description: `${saved.name} · ${saved.key}` })
      },
    })
  }
  const restart = () => { setDraft(draftOf(state)); setChecked(false); save.reset() }

  return (
    <div className="flex flex-col gap-4">
      {isReadOnly && (
        <Alert>
          <InfoIcon />
          <AlertTitle>{state.isDeleted ? "삭제한 프로젝트입니다" : "보관한 프로젝트입니다"}</AlertTitle>
          <AlertDescription>{state.isDeleted ? "되살리면 설정을 다시 고칠 수 있습니다." : "보관을 풀면 설정을 다시 고칠 수 있습니다."}</AlertDescription>
        </Alert>
      )}
      <SettingsSection title="프로젝트 정보">
        <SettingsRow wide label="프로젝트 기본정보" description="표식과 이름은 메뉴 · 목록 · 경로에 보입니다.">
          <div className="flex flex-col gap-1 @md/field-group:w-80">
            <div className="flex items-center gap-2">
              <MarkPicker icon={draft.icon} color={draft.color} isDisabled={isReadOnly} onChange={change} />
              <Input id={nameId} aria-label="프로젝트 이름" placeholder="예: 고객 포털 개편" value={draft.name} disabled={isReadOnly}
                aria-invalid={!!nameError} className="max-md:h-11" onChange={event => change({ name: event.target.value.slice(0, NAME_MAX) })} />
            </div>
            {nameError && <p role="alert" className="text-sm text-destructive">{nameError}</p>}
          </div>
        </SettingsRow>
        <SettingsRow wide label="키" description={`업무 번호가 ${draft.key || "APP"}-1처럼 붙습니다. 예전 키로 된 주소도 계속 열립니다.`}>
          <div className="flex flex-col gap-1 @md/field-group:w-80">
            <Input id={keyId} aria-label="키" placeholder="APP" value={draft.key} disabled={isReadOnly} aria-invalid={!!keyError}
              className="font-mono max-md:h-11" onChange={event => change({ key: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })} />
            {keyError && <p role="alert" className="text-sm text-destructive">{keyError}</p>}
          </div>
        </SettingsRow>
        <Field className="p-3">
          <FieldContent>
            <FieldLabel htmlFor={descriptionId}><FieldTitle>설명</FieldTitle></FieldLabel>
            <FieldDescription>회의록 요약에 참고합니다. 비워 두어도 됩니다.</FieldDescription>
          </FieldContent>
          <Textarea id={descriptionId} placeholder="이 프로젝트가 하는 일과 목표를 적어 주세요" value={draft.description} disabled={isReadOnly}
            className="min-h-32" onChange={event => change({ description: event.target.value.slice(0, DESCRIPTION_MAX) })} />
        </Field>
      </SettingsSection>
      {!isReadOnly && (
        <div className="flex justify-end gap-2 max-md:*:h-11 max-md:*:flex-1">
          <Button variant="secondary" disabled={!isChanged || save.isPending} onClick={restart}>되돌리기</Button>
          <Button disabled={!isChanged || save.isPending} onClick={submit}>
            {save.isPending && <Spinner data-icon="inline-start" />}변경 저장
          </Button>
        </div>
      )}
    </div>
  )
}

type Change = "archive" | "unarchive" | "delete" | "restore"

const ASK: Record<Change, { title: string; label: string; description: string; done: string }> = {
  archive: { title: "프로젝트를 보관할까요?", label: "보관", description: "진행 중 목록과 메뉴에서 빠지고 읽기만 됩니다. 보관함에서 되돌릴 수 있습니다.", done: "프로젝트를 보관했습니다" },
  unarchive: { title: "보관을 풀까요?", label: "보관 해제", description: "진행 중 목록과 메뉴로 돌아오고 설정을 다시 고칠 수 있습니다.", done: "보관을 풀었습니다" },
  delete: { title: "프로젝트를 삭제할까요?", label: "프로젝트 삭제", description: "삭제한 프로젝트는 프로젝트 목록의 삭제됨 탭에서 되살릴 수 있습니다.", done: "프로젝트를 삭제했습니다" },
  restore: { title: "프로젝트를 되살릴까요?", label: "되살리기", description: "삭제하기 전의 자리로 돌아오고 목록과 메뉴에 다시 보입니다.", done: "프로젝트를 되살렸습니다" },
}

/**
 * 위험 구역(호호코워크 DangerZone): 보관 또는 보관 해제, 키를 적어야 하는 삭제. 삭제한 프로젝트는 되살리기만 둔다.
 * 보관은 프로젝트 목록에 반영한다. 삭제는 목록에서 빼지 못하므로 이 쪽에만 남고, 떠나지 않고 삭제한 상태를 보인다.
 */
function DangerZone({ project, state }: { project: Project; state: GeneralState }) {
  const keyId = useId()
  const update = useUpdateProject()
  const setDeleted = useSetDeleted(project.id)
  const [asking, setAsking] = useState<Change | null>(null)
  const [typed, setTyped] = useState("")
  const isPending = update.isPending || setDeleted.isPending
  const ask = (change: Change) => { setTyped(""); setAsking(change) }
  const run = () => {
    if (!asking) return
    const done = { onSuccess: () => { toast.add({ type: "success", title: ASK[asking].done, description: state.name }); setAsking(null) } }
    if (asking === "archive" || asking === "unarchive") {
      update.mutate({ key: project.key, patch: { status: asking === "archive" ? "archived" : "active" } }, done)
    } else setDeleted.mutate(asking === "delete", done)
  }
  const row = (title: string, description: string, change: Change, isDestructive = false) => (
    <SettingsRow key={change} label={title} description={description}>
      <Button variant={isDestructive ? "destructive" : "secondary"} size="sm" className="max-md:h-11" onClick={() => ask(change)}>{ASK[change].label}</Button>
    </SettingsRow>
  )
  return (
    <>
      <SettingsSection title="위험 구역">
        {state.isDeleted
          ? row("프로젝트 되살리기", ASK.restore.description, "restore")
          : [
            project.status === "archived" ? row("보관 해제", ASK.unarchive.description, "unarchive") : row("프로젝트 보관", ASK.archive.description, "archive"),
            row("프로젝트 삭제", "목록과 메뉴에서 사라집니다. 이 프로젝트를 가리키던 일정 · 회의록 · 연장근무에는 이름이 그대로 보입니다.", "delete", true),
          ]}
      </SettingsSection>
      {asking === "delete" ? (
        <FormDialog open onOpenChange={open => { if (!open) setAsking(null) }} title={ASK.delete.title} description={ASK.delete.description}
          submitLabel={ASK.delete.label} isDestructive isSubmitDisabled={typed !== state.key} isPending={isPending} onSubmit={run}>
          <Field>
            <FieldLabel htmlFor={keyId}>확인을 위해 키 {state.key}를 입력해 주세요</FieldLabel>
            <Input id={keyId} value={typed} placeholder={state.key} autoFocus className="font-mono max-md:h-11"
              onChange={event => setTyped(event.target.value.toUpperCase())} />
          </Field>
        </FormDialog>
      ) : (
        <FormDialog open={!!asking} onOpenChange={open => { if (!open) setAsking(null) }} title={asking ? ASK[asking].title : ""}
          description={asking ? ASK[asking].description : undefined} submitLabel={asking ? ASK[asking].label : ""} isPending={isPending} onSubmit={run} />
      )}
    </>
  )
}
