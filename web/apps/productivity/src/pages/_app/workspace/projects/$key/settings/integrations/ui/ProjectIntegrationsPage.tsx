import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { projectOptions } from '@/entities/project';
import { CODE_PROVIDERS, integrationsOptions, type CodeProvider } from '@/entities/work-item';
import { Button } from '@/shared/ui/kit/button';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ConnectedRepositorySection } from './ConnectedRepositorySection';
import { ConnectRepositoryDialog } from './ConnectRepositoryDialog';
import { IntegrationRulesSection } from './IntegrationRulesSection';

type Crumb = { label: string; href?: string; icon?: string };

/**
 * A project's 설정 · 저장소 연동, for Workspace administrators (BIT's IntegrationSettings, D-087; 결정기록 2026-11-04 저장소
 * 연동): several repositories on GitLab, GitHub or Gitea, connected with a token (the server checks it and registers the
 * webhook itself where the token may) or without one (the webhook's address and secret shown to register by hand),
 * when a delivery last came and what went wrong, and the rules by which a pushed branch, an opened and a merged
 * request move the work items they name (DEMO-6). Work items show what was linked on their 활동.
 */
export function ProjectIntegrationsPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey: string }) {
  const project = useQuery(projectOptions(projectKey));
  const integrations = useQuery(integrationsOptions(projectKey));
  const [connecting, setConnecting] = useState<CodeProvider | null>(null);
  const failure = project.error ?? integrations.error;
  const page = { crumbs: pageCrumbs(crumbs), title: '저장소 연동' };
  if (failure) return <SettingsPage {...page}>
    <PageState kind="error" isCompact title="저장소 연동을 불러오지 못했습니다" description={failure.message} />
  </SettingsPage>;
  if (!project.data || !integrations.data) return <SettingsPage {...page}>{null}</SettingsPage>;
  const connected = integrations.data;
  return <SettingsPage {...page}
    description={`저장소의 브랜치 · PR(MR) · 커밋에 업무 번호(예: ${projectKey}-1)를 적으면 그 업무의 활동에 이어지고, 아래 규칙대로 상태가 옮겨집니다.`}>
    {connected.map(integration => <ConnectedRepositorySection key={integration.id} projectKey={projectKey} integration={integration} />)}
    <SettingsSection title={connected.length ? '저장소 추가 연결' : '저장소 연결'}>
      {CODE_PROVIDERS.map(provider => <SettingsRow key={provider.value} label={provider.label} description={provider.hint}>
        <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setConnecting(provider.value)}>연결</Button>
      </SettingsRow>)}
    </SettingsSection>
    <IntegrationRulesSection projectKey={projectKey} />
    {connecting ? <ConnectRepositoryDialog projectKey={projectKey} provider={connecting} onClose={() => setConnecting(null)} /> : null}
  </SettingsPage>;
}
