import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getJson, sendCommand, sendJson, type components } from '@/shared/api';
import { workItemPath } from './work-items';

/*
 * 저장소 연동 (BIT's Git 연동, D-087): a project's repositories on GitHub, GitLab or Gitea (its 설정 › 저장소 연동, for
 * Workspace administrators), the rules by which what happens in them moves work items, and a work item's branches, pull
 * or merge requests and commits. Reads sit under ['code'], so a change reads them all again.
 */

type Schemas = components['schemas'];
type Required<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export type CodeProvider = 'github' | 'gitlab' | 'gitea';
/** A project's repository on a host; webhookSecret is empty but for Workspace administrators. */
export type CodeIntegration = Required<Schemas['CodeIntegration'], 'id' | 'provider' | 'baseUrl' | 'repository' | 'webUrl' | 'webhookUrl' | 'version'>;
export type CodeRuleEvent = 'branch_push' | 'pr_opened' | 'pr_merged';
export type CodeRule = Required<Schemas['CodeRule'], 'event'>;
/** A work item's link into a repository: a branch, a pull or merge request (in its state) or a commit. */
export type CodeLink = Required<Schemas['CodeLink'], 'id' | 'integrationId' | 'provider' | 'baseUrl' | 'repository' | 'kind' | 'externalId' | 'url' | 'title' | 'state' | 'updatedAt'>;

/** The hosts a repository is connected on: GitLab first. */
export const CODE_PROVIDERS: { value: CodeProvider; label: string; defaultUrl?: string; hint: string }[] = [
  { value: 'gitlab', label: 'GitLab', defaultUrl: 'https://gitlab.com', hint: '직접 운영하는 GitLab은 그 주소를 적습니다.' },
  { value: 'github', label: 'GitHub', defaultUrl: 'https://github.com', hint: 'Enterprise Server는 그 주소를 적습니다.' },
  { value: 'gitea', label: 'Gitea', hint: 'Gitea는 그 주소가 필요합니다.' },
];
export const providerName = (provider: string) => CODE_PROVIDERS.find(each => each.value === provider)?.label ?? provider;

/** What each rule's event is, in a manager's words. */
export const RULE_EVENTS: { value: CodeRuleEvent; label: string; hint: string }[] = [
  { value: 'branch_push', label: '브랜치를 올리면', hint: '업무 번호가 든 브랜치를 처음 올렸을 때, 아직 시작 전인 업무' },
  { value: 'pr_opened', label: 'PR · MR을 열면', hint: '업무 번호가 든 PR · MR을 열었을 때, 더 앞선 상태로만' },
  { value: 'pr_merged', label: 'PR · MR을 병합하면', hint: '병합했을 때, 아직 닫히지 않은 업무' },
];

const at = (key: string) => `/api/v1/workspace/projects/${encodeURIComponent(key)}`;
const codeKeys = {
  all: ['code'] as const,
  integrations: (key: string) => ['code', 'integrations', key] as const,
  rules: (key: string) => ['code', 'rules', key] as const,
  links: (key: string, number: number) => ['code', 'links', key, number] as const,
};

export const integrationsOptions = (key: string) => queryOptions({
  queryKey: codeKeys.integrations(key),
  queryFn: ({ signal }) => getJson<CodeIntegration[]>(`${at(key)}/integrations`, signal),
});

export const integrationRulesOptions = (key: string) => queryOptions({
  queryKey: codeKeys.rules(key),
  queryFn: ({ signal }) => getJson<{ items: CodeRule[] }>(`${at(key)}/integration-rules`, signal).then(rules => rules.items),
});

/** A work item's links into its project's repositories, the latest moved last. */
export const codeLinksOptions = (key: string, number: number) => queryOptions({
  queryKey: codeKeys.links(key, number),
  queryFn: ({ signal }) => getJson<CodeLink[]>(`${workItemPath(key, number)}/code-links`, signal),
});

/** Connects a repository: a token is checked with the host first (none: the webhook is registered by hand). */
export const connectRepository = (key: string, input: { provider: CodeProvider; baseUrl?: string; repository: string; token?: string }) =>
  sendJson<CodeIntegration>(`${at(key)}/integrations`, 'POST', input);

export const reviseIntegration = (key: string, integration: CodeIntegration, token: string) =>
  sendJson<CodeIntegration>(`${at(key)}/integrations/${integration.id}`, 'PATCH', { expectedVersion: integration.version, token });

export const disconnectRepository = (key: string, integration: CodeIntegration) =>
  sendCommand(`${at(key)}/integrations/${integration.id}`, 'DELETE');

/** One event's rule: set (with a column, or none: it stays) or back to the board's default. */
export const setIntegrationRule = (key: string, rule: { event: CodeRuleEvent; set: boolean; columnId?: string | null }) =>
  sendJson<{ items: CodeRule[] }>(`${at(key)}/integration-rules`, 'PUT', { items: [rule] });

export const refreshCode = (client: QueryClient) => client.invalidateQueries({ queryKey: codeKeys.all });
