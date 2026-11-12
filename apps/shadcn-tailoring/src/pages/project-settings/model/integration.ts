import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type CodeProvider = "gitlab" | "github" | "gitea"

/** 연결한 저장소 하나(호호코워크 CodeIntegration). 토큰 값은 서버가 암호화해 두므로 화면은 있는지만 안다. */
export type CodeIntegration = {
  id: string
  provider: CodeProvider
  /** group/project 또는 owner/repository. */
  repository: string
  webUrl: string
  hasToken: boolean
  /** 토큰 주인의 계정. */
  accountLogin?: string
  /** 서버가 저장소에 웹훅을 직접 등록했는지(토큰에 관리 권한이 있을 때). 아니면 주소와 비밀값을 보인다. */
  webhookRegistered: boolean
  webhookUrl: string
  webhookSecret: string
  /** 마지막으로 받은 웹훅(ISO 시각). */
  lastEventAt?: string
  lastError?: string
}

export const CODE_PROVIDERS: readonly { value: CodeProvider; label: string; defaultUrl?: string; hint: string }[] = [
  { value: "gitlab", label: "GitLab", defaultUrl: "https://gitlab.com", hint: "회사 GitLab은 주소에 https://gitlab.hohoco.store를 적습니다." },
  { value: "github", label: "GitHub", defaultUrl: "https://github.com", hint: "Enterprise Server는 그 주소를 적습니다." },
  { value: "gitea", label: "Gitea", hint: "Gitea는 그 주소가 필요합니다." },
]
export const providerOf = (provider: CodeProvider) => CODE_PROVIDERS.find(each => each.value === provider) ?? CODE_PROVIDERS[0]

export type RuleEvent = "branch_push" | "pr_opened" | "pr_merged"
export const RULE_EVENTS: readonly { value: RuleEvent; label: string; hint: string }[] = [
  { value: "branch_push", label: "브랜치를 올리면", hint: "업무 번호가 든 브랜치를 처음 올렸을 때, 아직 시작 전인 업무" },
  { value: "pr_opened", label: "PR · MR을 열면", hint: "업무 번호가 든 PR · MR을 열었을 때, 더 앞선 상태로만" },
  { value: "pr_merged", label: "PR · MR을 병합하면", hint: "병합했을 때, 아직 닫히지 않은 업무" },
]
/** 규칙 하나의 값: 보드 기본값, 고른 칸, 옮기지 않음. */
export type RuleChoice = { kind: "default" } | { kind: "column"; columnId: string } | { kind: "stay" }
export type Rules = Record<RuleEvent, RuleChoice>

/*
 * 저장소 연동은 서버가 없으므로 이 쪽의 캐시에만 남긴다(프로젝트마다). COWORK에는 토큰으로 연결한 GitLab과
 * 토큰 없이 연결한 GitHub가 있고, 다른 프로젝트는 아직 연결이 없다.
 */
const integrationsKey = (projectKey: string) => ["project-settings", "integrations", projectKey.toUpperCase()] as const
const rulesKey = (projectKey: string) => ["project-settings", "integration-rules", projectKey.toUpperCase()] as const
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const secret = () => Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("")
const hookUrl = (id: string) => `https://cowork.hohoco.store/api/v1/webhooks/code/${id}`

const MOCK: Record<string, CodeIntegration[]> = {
  COWORK: [
    {
      id: "code-1", provider: "gitlab", repository: "hohoco/cowork-web", webUrl: "https://gitlab.hohoco.store/hohoco/cowork-web",
      hasToken: true, accountLogin: "goraebap", webhookRegistered: true, webhookUrl: hookUrl("code-1"), webhookSecret: "k3v9t0qz5m2x8a1c7d4e6f0g2h8j5l1n",
      lastEventAt: "2026-11-11T17:42:00+09:00",
    },
    {
      id: "code-2", provider: "github", repository: "hohoco/cowork-docs", webUrl: "https://github.com/hohoco/cowork-docs",
      hasToken: false, webhookRegistered: false, webhookUrl: hookUrl("code-2"), webhookSecret: "p8r2s6u0w4y1b5d9f3h7j0l4n8q2t6v0",
      lastError: "서명이 맞지 않는 웹훅을 받았습니다. 저장소에 넣은 Secret을 확인해 주세요.",
    },
  ],
}

export function useIntegrations(projectKey: string) {
  return useQuery({
    queryKey: integrationsKey(projectKey),
    queryFn: () => later(MOCK[projectKey.toUpperCase()] ?? []),
    staleTime: Infinity,
  })
}

/** 붙여 넣은 저장소 주소에서 경로만 남긴다(https://github.com/owner/repo.git → owner/repo). */
const repositoryOf = (value: string) => value.trim().replace(/^https?:\/\/[^/]+\//, "").replace(/\.git$/, "").replace(/^\/+|\/+$/g, "")

export function useConnectRepository(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ provider, baseUrl, repository, token }: { provider: CodeProvider; baseUrl?: string; repository: string; token?: string }) => {
      const path = repositoryOf(repository)
      if (!/^[^/\s]+(\/[^/\s]+)+$/.test(path)) throw new Error("저장소를 group/project 또는 owner/repository 꼴로 적어 주세요.")
      const existing = client.getQueryData<CodeIntegration[]>(integrationsKey(projectKey)) ?? []
      if (existing.some(each => each.provider === provider && each.repository === path)) throw new Error("이미 연결한 저장소입니다.")
      const id = `code-${Date.now()}`
      const host = (baseUrl || providerOf(provider).defaultUrl || "").replace(/\/+$/, "")
      return later<CodeIntegration>({
        id, provider, repository: path, webUrl: `${host}/${path}`, hasToken: !!token, accountLogin: token ? "goraebap" : undefined,
        webhookRegistered: !!token, webhookUrl: hookUrl(id), webhookSecret: secret(),
      })
    },
    onSuccess: integration => client.setQueryData<CodeIntegration[]>(integrationsKey(projectKey), old => [...(old ?? []), integration]),
  })
}

/** 토큰을 넣거나 바꾼다. 이미 등록한 웹훅은 그대로다. */
export function useReviseToken(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => later(id),
    onSuccess: id => client.setQueryData<CodeIntegration[]>(integrationsKey(projectKey), old =>
      old?.map(each => (each.id === id ? { ...each, hasToken: true, accountLogin: "goraebap" } : each))),
  })
}

export function useDisconnectRepository(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => later(id),
    onSuccess: id => client.setQueryData<CodeIntegration[]>(integrationsKey(projectKey), old => old?.filter(each => each.id !== id)),
  })
}

const DEFAULT_RULES: Rules = { branch_push: { kind: "default" }, pr_opened: { kind: "default" }, pr_merged: { kind: "default" } }

export function useRules(projectKey: string) {
  return useQuery({ queryKey: rulesKey(projectKey), queryFn: () => later(DEFAULT_RULES), staleTime: Infinity })
}

export function useSetRule(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: { event: RuleEvent; choice: RuleChoice }) => input,
    onMutate: ({ event, choice }) => client.setQueryData<Rules>(rulesKey(projectKey), old => ({ ...(old ?? DEFAULT_RULES), [event]: choice })),
  })
}
