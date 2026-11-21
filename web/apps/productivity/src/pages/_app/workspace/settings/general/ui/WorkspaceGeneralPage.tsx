import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { projectsOptions } from '@/entities/project';
import { labelsOptions, typesOptions, WorkItemTypeIcon } from '@/entities/work-item';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { Button } from '@/shared/ui/kit/button';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';

type Crumb = { label: string; href?: string; icon?: string };

/**
 * 프로젝트 관리 › 일반 (BIT's workspace 일반, as far as cowork has one; 결정기록 2026-11-04 프로젝트 관리): cowork is
 * one workspace with no name, logo or owner of its own to change, so this is where the settings every project shares
 * are seen at once: how many projects are going, archived and deleted (managed in the 프로젝트 list), the default work
 * item type, and how many types and labels there are, each with the way to where it changes.
 */
export function WorkspaceGeneralPage({ crumbs }: { crumbs: Crumb[] }) {
  const active = useQuery(projectsOptions('ACTIVE'));
  const archived = useQuery(projectsOptions('ARCHIVED'));
  const deleted = useQuery(projectsOptions('DELETED'));
  const types = useQuery(typesOptions());
  const labels = useQuery(labelsOptions());
  const count = (query: { data?: readonly unknown[]; isError: boolean }) => query.data ? `${query.data.length}개` : query.isError ? '불러오지 못함' : '불러오는 중';
  const fallback = types.data?.find(type => type.isDefault);
  const go = (href: string, label: string) => <Button variant="secondary" size="sm" nativeButton={false} render={<Link to={href} />}>{label}</Button>;
  const value = (text: string) => <span className="tabular-nums">{text}</span>;
  return <SettingsPage crumbs={pageCrumbs(crumbs)} title="일반">
    <SettingsSection title="프로젝트" action={go('/workspace/projects', '프로젝트 목록')}>
      <SettingsRow label="진행 중">{value(count(active))}</SettingsRow>
      <SettingsRow label="보관함">{value(count(archived))}</SettingsRow>
      <SettingsRow label="삭제됨">{value(count(deleted))}</SettingsRow>
    </SettingsSection>
    <SettingsSection title="업무" action={go('/workspace/settings/work-item-types', '업무 유형')}>
      <SettingsRow label="기본 유형">
        {fallback
          ? <span className="flex items-center gap-2"><WorkItemTypeIcon type={fallback.code} />{fallback.name}</span>
          : <span>{types.isError ? '불러오지 못함' : types.data ? '기본 유형 없음' : '불러오는 중'}</span>}
      </SettingsRow>
      <SettingsRow label="업무 유형">{value(count(types))}</SettingsRow>
      <SettingsRow label="라벨"><span className="flex items-center gap-3">{value(count(labels))}{go('/workspace/settings/work-item-labels', '라벨 관리')}</span></SettingsRow>
    </SettingsSection>
  </SettingsPage>;
}
