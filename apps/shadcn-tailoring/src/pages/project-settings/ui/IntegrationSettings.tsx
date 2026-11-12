import { useId, useState, type ReactNode } from "react"
import { useCurrentProject } from "@/entities/project"
import { useWorkflow, type WorkflowColumn } from "@/entities/work-item"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/ui/field"
import { BranchIcon, ChevronDownIcon, CopyIcon, EyeIcon, SquareArrowOutUpRightIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { OptionList } from "@/shared/ui/option-list"
import { PageState } from "@/shared/ui/page-state"
import { SettingsRow, SettingsSection } from "@/shared/ui/settings"
import { toast } from "@/shared/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import {
  CODE_PROVIDERS, RULE_EVENTS, providerOf, useConnectRepository, useDisconnectRepository, useIntegrations, useReviseToken, useRules, useSetRule,
  type CodeIntegration, type CodeProvider, type RuleChoice, type RuleEvent,
} from "../model/integration"
import { FormDialog, SettingsBody } from "./GeneralParts"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

const when = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })

/**
 * 프로젝트 설정의 저장소 연동(호호코워크 ProjectIntegrationsPage): GitLab · GitHub · Gitea 저장소 여럿을 토큰으로(서버가 웹훅을
 * 직접 등록) 또는 토큰 없이(웹훅 주소와 비밀값을 직접 등록) 잇고, 브랜치 · PR(MR)이 업무를 옮기는 규칙을 정한다.
 */
export function IntegrationSettings() {
  const { key, project } = useCurrentProject()
  const integrations = useIntegrations(key)
  const [connecting, setConnecting] = useState<CodeProvider | null>(null)
  const body = () => {
    if (project === null) return <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" description="주소가 바뀌었거나 없는 프로젝트입니다." />
    if (!project || !integrations.data) return null
    const connected = integrations.data
    return (
      <SettingsBody title="저장소 연동"
        description={`저장소의 브랜치 · PR(MR) · 커밋에 업무 번호(예: ${project.key.toLowerCase()}-1)를 적으면 그 업무의 활동에 이어지고, 아래 규칙대로 상태가 옮겨집니다.`}>
        {connected.map(integration => <Connected key={integration.id} projectKey={key} integration={integration} />)}
        <SettingsSection title={connected.length ? "저장소 추가 연결" : "저장소 연결"}>
          {CODE_PROVIDERS.map(provider => (
            <SettingsRow key={provider.value} label={provider.label} description={provider.hint}>
              <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setConnecting(provider.value)}>연결</Button>
            </SettingsRow>
          ))}
        </SettingsSection>
        <Rules projectKey={key} />
        {connecting && <ConnectDialog projectKey={key} provider={connecting} onClose={() => setConnecting(null)} />}
      </SettingsBody>
    )
  }
  return <ProjectSettingsFrame label="저장소 연동" icon={BranchIcon}>{body()}</ProjectSettingsFrame>
}

/** 줄 끝의 작은 아이콘 버튼(복사 · 보기). 휴대폰은 44px. */
function IconAction({ label, tooltip, onClick, children }: { label: string; tooltip: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} className="max-md:size-11" onClick={onClick}>{children}</Button>} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

/** 값 없이 읽기만 하는 줄(SettingsRow는 값이 없으면 "-"를 보인다). */
function InfoRow({ label, description }: { label: string; description: string }) {
  return (
    <Field orientation="horizontal" className="min-h-11 p-3">
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
    </Field>
  )
}

/** 웹훅 주소 · 비밀값: 줄에 맞춰 자른 고정폭 글자. */
function Code({ children }: { children: ReactNode }) {
  return <code className="min-w-0 truncate font-mono text-xs text-muted-foreground md:max-w-64 max-md:flex-1 max-md:text-sm">{children}</code>
}

/** 연결한 저장소 하나: 어디인지, 누구의 토큰인지, 웹훅(등록됨, 또는 주소와 비밀값), 끊기. */
function Connected({ projectKey, integration }: { projectKey: string; integration: CodeIntegration }) {
  const remove = useDisconnectRepository(projectKey)
  const [isToken, setToken] = useState(false)
  const [isAsking, setAsking] = useState(false)
  const [isShown, setShown] = useState(false)
  const name = providerOf(integration.provider).label
  const isGitLab = integration.provider === "gitlab"
  const copy = (value: string, what: string) => {
    const done = () => toast.add({ type: "success", title: `${what}을 복사했습니다.` })
    const failed = () => toast.add({ type: "error", title: "복사하지 못했습니다." })
    if (navigator.clipboard) void navigator.clipboard.writeText(value).then(done, failed)
    else failed()
  }
  const heard = integration.lastEventAt ? `마지막으로 받은 웹훅 ${when.format(new Date(integration.lastEventAt))}` : "아직 받은 웹훅이 없습니다"
  return (
    <SettingsSection title={`${name} · ${integration.repository}`}>
      {/* 이름 자리가 링크라 SettingsRow(글자 이름) 대신 같은 모양의 Field로 둔다. */}
      <Field orientation="responsive" className="min-h-11 p-3 @md/field-group:has-[>[data-slot=field-content]]:items-center">
        <FieldContent>
          <FieldTitle>
            <a href={integration.webUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              {integration.repository}<SquareArrowOutUpRightIcon className="size-3.5 text-icon-muted" />
            </a>
          </FieldTitle>
          <FieldDescription>
            {integration.hasToken
              ? integration.accountLogin ? `${integration.accountLogin} 계정의 토큰으로 연결했습니다.` : "토큰으로 연결했습니다."
              : "토큰 없이 연결했습니다. 웹훅은 저장소에 직접 등록합니다."}
          </FieldDescription>
        </FieldContent>
        <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setToken(true)}>{integration.hasToken ? "토큰 바꾸기" : "토큰 넣기"}</Button>
      </Field>
      {integration.webhookRegistered ? (
        <InfoRow label="웹훅" description={`서버가 저장소에 직접 등록했습니다. ${heard}.`} />
      ) : (
        <>
          <SettingsRow wide label="웹훅 주소"
            description={`${name} 저장소 설정의 Webhooks에 이 주소와 아래 비밀값을 넣고, Push와 ${isGitLab ? "Merge request" : "Pull request"} 이벤트를 고릅니다(JSON). ${heard}.`}>
            <div className="flex min-w-0 items-center gap-1">
              <Code>{integration.webhookUrl}</Code>
              <IconAction label="웹훅 주소 복사" tooltip="복사" onClick={() => copy(integration.webhookUrl, "웹훅 주소")}><CopyIcon /></IconAction>
            </div>
          </SettingsRow>
          <SettingsRow wide label={isGitLab ? "Secret token" : "Secret"} description="이 값으로 서명한 웹훅만 받습니다. 다른 사람에게 보이지 않게 하세요.">
            <div className="flex min-w-0 items-center gap-1">
              <Code>{isShown ? integration.webhookSecret : "••••••••••••"}</Code>
              <IconAction label={isShown ? "비밀값 숨기기" : "비밀값 보기"} tooltip={isShown ? "숨기기" : "보기"} onClick={() => setShown(!isShown)}>
                <EyeIcon chosen={isShown} />
              </IconAction>
              <IconAction label="비밀값 복사" tooltip="복사" onClick={() => copy(integration.webhookSecret, "비밀값")}><CopyIcon /></IconAction>
            </div>
          </SettingsRow>
        </>
      )}
      {integration.lastError && <InfoRow label="최근 오류" description={integration.lastError} />}
      <SettingsRow label="연결 끊기" description="연결과 업무에 이어진 브랜치 · PR · 커밋 기록을 지웁니다. 업무는 그대로 남습니다.">
        <Button variant="destructive" size="sm" className="max-md:h-11" onClick={() => setAsking(true)}>연결 끊기</Button>
      </SettingsRow>
      {isToken && <TokenDialog projectKey={projectKey} integration={integration} onClose={() => setToken(false)} />}
      <ConfirmDialog open={isAsking} onOpenChange={setAsking} title={`${name} 연결을 끊을까요?`}
        description={`${integration.repository}와의 연결과 업무에 이어진 코드 기록이 지워집니다. 다시 연결하면 새로 쌓입니다.`}
        action={{
          label: "연결 끊기", isPending: remove.isPending,
          onAction: () => remove.mutate(integration.id, {
            onSuccess: () => { toast.add({ type: "success", title: "연결을 끊었습니다", description: integration.repository }); setAsking(false) },
          }),
        }} />
    </SettingsSection>
  )
}

/** 입력 칸 하나: 이름, 칸, 설명. */
function TextField({ label, description, isRequired, ...input }: {
  label: string; description?: string; isRequired?: boolean; value: string; onChange: (value: string) => void
  placeholder?: string; type?: string; autoFocus?: boolean
}) {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}{!isRequired && <span className="font-normal text-muted-foreground">(선택)</span>}</FieldLabel>
      <Input id={id} required={isRequired} value={input.value} placeholder={input.placeholder} type={input.type} autoFocus={input.autoFocus}
        className="max-md:h-11" onChange={event => input.onChange(event.target.value)} />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

/** 연결: 호스트 주소(GitLab은 회사 주소, GitHub는 기본, Gitea는 꼭), 저장소, 토큰(없어도 됨). */
function ConnectDialog({ projectKey, provider, onClose }: { projectKey: string; provider: CodeProvider; onClose: () => void }) {
  const connect = useConnectRepository(projectKey)
  const host = providerOf(provider)
  const [baseUrl, setBaseUrl] = useState(provider === "gitlab" ? "https://gitlab.hohoco.store" : "")
  const [repository, setRepository] = useState("")
  const [token, setToken] = useState("")
  const submit = () => connect.mutate({ provider, baseUrl: baseUrl.trim() || undefined, repository, token: token.trim() || undefined }, {
    onSuccess: integration => {
      toast.add({
        type: "success", title: "저장소를 연결했습니다",
        description: integration.webhookRegistered ? integration.repository : `${integration.repository} · 웹훅 주소와 비밀값을 저장소에 등록해 주세요.`,
      })
      onClose()
    },
  })
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose() }} title={`${host.label} 저장소 연결`} description={host.hint} submitLabel="연결하기"
      isPending={connect.isPending} isSubmitDisabled={!repository.trim() || (provider === "gitea" && !baseUrl.trim())} onSubmit={submit}>
      <TextField label="주소" value={baseUrl} onChange={setBaseUrl} isRequired={provider === "gitea"} placeholder={host.defaultUrl ?? "https://git.example.com"} />
      <TextField label="저장소" value={repository} onChange={value => { connect.reset(); setRepository(value) }} isRequired autoFocus
        placeholder={provider === "gitlab" ? "group/project" : "owner/repository"} description="저장소 주소를 그대로 붙여 넣어도 됩니다." />
      <TextField label="토큰" type="password" value={token} onChange={setToken} placeholder="비워 두어도 됩니다"
        description="있으면 서버가 저장소를 확인하고 웹훅을 직접 등록합니다(저장소 관리 권한). 없으면 연결한 뒤 보이는 주소와 비밀값을 저장소에 직접 등록합니다. 토큰은 암호화해 둡니다." />
      {connect.error && <p role="alert" className="text-sm text-destructive">{connect.error.message}</p>}
    </FormDialog>
  )
}

/** 연결의 새 토큰. 호스트에서 확인한 뒤 암호화해 둔다. */
function TokenDialog({ projectKey, integration, onClose }: { projectKey: string; integration: CodeIntegration; onClose: () => void }) {
  const save = useReviseToken(projectKey)
  const [token, setToken] = useState("")
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose() }} title={integration.hasToken ? "토큰 바꾸기" : "토큰 넣기"}
      description={integration.repository} submitLabel="저장" isPending={save.isPending} isSubmitDisabled={!token.trim()}
      onSubmit={() => save.mutate(integration.id, { onSuccess: () => { toast.add({ type: "success", title: "토큰을 저장했습니다" }); onClose() } })}>
      <TextField label="토큰" type="password" value={token} onChange={setToken} isRequired autoFocus placeholder="새 토큰 붙여 넣기"
        description="저장소에서 확인한 뒤 암호화해 둡니다. 이미 등록한 웹훅은 그대로입니다." />
    </FormDialog>
  )
}

/** 보드가 정하는 기본 칸: 브랜치는 첫 진행 중, PR을 열면 마지막 진행 중, 병합하면 첫 완료. */
function defaultColumn(event: RuleEvent, columns: readonly WorkflowColumn[]) {
  const started = columns.filter(column => column.category === "STARTED")
  if (event === "branch_push") return started[0]
  if (event === "pr_opened") return started[started.length - 1]
  return columns.find(column => column.category === "COMPLETED")
}

const valueOf = (choice: RuleChoice, columns: readonly WorkflowColumn[]) =>
  choice.kind === "column" ? (columns.some(column => column.id === choice.columnId) ? choice.columnId : "default") : choice.kind

/** 규칙 하나의 고르기: 보드 기본값 · 칸들 · 옮기지 않음. 데스크톱 팝오버, 휴대폰 바텀시트. */
function RulePicker({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void
}) {
  const [isOpen, setOpen] = useState(false)
  const current = options.find(option => option.value === value) ?? options[0]
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={setOpen} align="end" className="w-60 p-1.5"
      trigger={
        <Button variant="outline" aria-label={`${label}: ${current.label}`} className="w-full justify-between @md/field-group:w-52 max-md:h-11">
          <span className="truncate">{current.label}</span>
          <ChevronDownIcon data-icon="inline-end" className="text-icon-muted" />
        </Button>
      }>
      <OptionList label={`${label} 고르기`} options={options} chosen={[value]} isSearchable={options.length > 7}
        onPick={next => { onChange(next); setOpen(false) }} />
    </AdaptivePopover>
  )
}

/** 자동 이동 규칙: 이벤트마다 그 업무를 옮길 칸. 칸은 프로젝트 워크플로(업무 entity)의 상태다. 휴대폰은 이름 아래로 고르기를 내린다. */
function Rules({ projectKey }: { projectKey: string }) {
  const rules = useRules(projectKey)
  const columns = useWorkflow(projectKey)
  const setRule = useSetRule(projectKey)
  if (!rules.data || !columns.data) return null
  const board = columns.data
  return (
    <SettingsSection title="자동 이동 규칙">
      {RULE_EVENTS.map(event => {
        const fallback = defaultColumn(event.value, board)
        const options = [
          { value: "default", label: `보드 기본값 (${fallback?.name ?? "옮기지 않음"})` },
          ...board.map(column => ({ value: column.id, label: column.name })),
          { value: "stay", label: "옮기지 않음" },
        ]
        const change = (next: string) => setRule.mutate({
          event: event.value,
          choice: next === "default" || next === "stay" ? { kind: next } : { kind: "column", columnId: next },
        })
        return (
          <SettingsRow key={event.value} wide label={event.label} description={event.hint}>
            <RulePicker label={event.label} value={valueOf(rules.data[event.value], board)} options={options} onChange={change} />
          </SettingsRow>
        )
      })}
    </SettingsSection>
  )
}
