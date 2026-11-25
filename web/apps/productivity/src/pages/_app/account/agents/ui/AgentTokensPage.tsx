import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { directoryAgentKeys } from '@/entities/organization';
import { Badge } from '@goraebap/ui-react/compact/badge';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { Mark } from '@/shared/ui/mark-picker';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { IconAction } from '@/shared/ui/settings';
import { agentProfilesOptions, agentTokenKeys, agentTokensOptions, revokeAgentToken, type AgentProfile, type AgentToken, type AgentTokenCreated } from '../api/agents';
import { AgentRow } from './AgentRow';
import { AgentEditorDialog, AgentTokenSecretDialog } from './AgentTokenDialogs';
import { AgentUsageSection } from './AgentUsageSection';

type Crumb = { label: string; href?: string; icon?: string };

const day = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
const moment = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const dayText = (iso?: string | null) => (iso ? day.format(new Date(iso)) : '');

/** A token's line: its first characters, when it was made and ends, and its last use. */
function describe(token: AgentToken) {
  const ends = token.expiresAt ? `만료 ${moment.format(new Date(token.expiresAt))}` : '만료 없음';
  const used = token.lastUsedAt ? `마지막 사용 ${moment.format(new Date(token.lastUsedAt))}` : '아직 쓰지 않음';
  return `${token.prefix}… · ${dayText(token.createdAt)} 만듦 · ${ends} · ${used}`;
}

/**
 * 에이전트 토큰: the tokens with which agents (Claude Code and the like) act as the member through cowork's MCP server.
 * Each row is one token, its agent and whether it has expired at the end, revoked after asking; a new one is shown once.
 */
export function AgentTokensPage({ crumbs }: { crumbs: Crumb[] }) {
  const client = useQueryClient();
  const tokens = useQuery(agentTokensOptions());
  const profiles = useQuery(agentProfilesOptions());
  const [editor, setEditor] = useState<{ profile?: AgentProfile; isEditing: boolean } | null>(null);
  const [created, setCreated] = useState<AgentTokenCreated | null>(null);
  const [revoking, setRevoking] = useState<AgentToken | null>(null);
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: agentTokenKeys.all }),
    client.invalidateQueries({ queryKey: directoryAgentKeys }),
  ]);
  const revoke = useMutation({ mutationFn: (id: string) => revokeAgentToken(id), onSuccess: () => setRevoking(null), onSettled: refresh });
  const list = tokens.data ?? [];
  const profilesById = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
  const connected = new Set(list.map(token => token.profileId));
  const drafts = (profiles.data ?? []).filter(profile => !connected.has(profile.id));
  const add = (
    <Button variant="secondary" size="sm" onClick={() => setEditor({ isEditing: false })}>
      <PlusIcon data-icon="inline-start" />에이전트 추가
    </Button>
  );
  const profileSaved = () => {
    setEditor(null);
    void refresh();
    void client.invalidateQueries({ queryKey: ['workItems', 'timeline'] });
    void client.invalidateQueries({ queryKey: ['documents', 'activity'] });
  };
  const revokedName = revoking?.agentName ?? revoking?.name ?? '';
  return (
    <SettingsPage crumbs={pageCrumbs(crumbs)} title="내 AI 에이전트">
      {tokens.error || profiles.error ? <PageState kind="error" title="내 AI 에이전트를 불러오지 못했습니다" description={(tokens.error ?? profiles.error)?.message} />
        : profiles.isPending || tokens.isPending ? <p className="text-sm text-muted-foreground">불러오는 중…</p>
        : <>
          <SettingsSection title="에이전트" action={add}>
            {list.length === 0 ? <SettingsRow label="아직 등록한 에이전트가 없습니다" hasValue={false} /> : list.map(token => {
              const profile = token.profileId ? profilesById.get(token.profileId) : undefined;
              const name = profile?.name ?? token.agentName ?? token.name ?? '에이전트';
              return (
                <AgentRow key={token.id} name={name} description={describe(token)}
                  mark={<Mark isCircular icon={profile?.icon ?? 'agent'} color={profile?.color} letter={name} size="md" />}>
                  {token.expired ? <Badge variant="secondary">만료됨</Badge> : null}
                  {profile && !token.expired ? <IconAction label={`${name} 프로필 수정`} tooltip="프로필 수정"
                    onClick={() => setEditor({ profile, isEditing: true })}><PenSquareIcon /></IconAction> : null}
                  <IconAction label={`${name} 토큰 폐기`} tooltip="토큰 폐기" onClick={() => { revoke.reset(); setRevoking(token); }}><Trash2Icon /></IconAction>
                </AgentRow>
              );
            })}
          </SettingsSection>
          {drafts.length > 0 ? <SettingsSection title="토큰 발급 대기">
            {drafts.map(profile => (
              <AgentRow key={profile.id} name={profile.name} mark={<Mark isCircular icon={profile.icon} color={profile.color} letter={profile.name} size="md" />}>
                <Button variant="secondary" size="sm" onClick={() => setEditor({ profile, isEditing: false })}>토큰 발급</Button>
              </AgentRow>
            ))}
          </SettingsSection> : null}
        </>}
      <AgentUsageSection />
      {editor ? <AgentEditorDialog profile={editor.profile} isEditing={editor.isEditing}
        onClose={() => setEditor(null)} onSaved={profileSaved}
        onCreated={made => { profileSaved(); setCreated(made); }} /> : null}
      <AgentTokenSecretDialog created={created} onClose={() => setCreated(null)} />
      <ConfirmDialog open={!!revoking} onOpenChange={open => { if (!open) { setRevoking(null); revoke.reset(); } }}
        title={`'${revokedName}' 토큰을 폐기할까요?`}
        description={revoke.error?.message ?? `이 토큰을 쓰는 ${revoking?.agentName ?? '에이전트'}은(는) 바로 연결이 끊깁니다. 되돌릴 수 없습니다.`}
        action={{ label: '폐기', isPending: revoke.isPending, onAction: () => { if (revoking?.id) revoke.mutate(revoking.id); } }} />
    </SettingsPage>
  );
}
