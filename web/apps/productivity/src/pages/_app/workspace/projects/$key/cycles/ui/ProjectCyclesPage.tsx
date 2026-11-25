import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { CYCLE_STATES, cyclesOptions, deleteCycle, editCycle, refreshWorkItems, type Cycle } from '@/entities/work-item';
import { useProjectCan } from '@/entities/project';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { CalendarIcon, CircleCheckIcon, PenSquareIcon, SettingsIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { CycleFormDialog, iso } from './CycleFormDialog';
import { CycleRow } from './CycleRow';
import { FinishCycleDialog } from './FinishCycleDialog';
import { isNotFound } from '@/shared/api';

/** The router's crumbs (icons by meaning name), handed to the kit Page through pageCrumbs. */
type Crumb = { label: string; href?: string; icon?: string };

/** How a cycle stands as Linear names it: under way, the next one, those planned after it, over, finished. */
const stateOf = (cycle: Cycle, next?: Cycle) =>
  cycle.state === 'UPCOMING' ? (cycle.id === next?.id ? '다음' : '계획') : CYCLE_STATES[cycle.state ?? 'UPCOMING'];

/**
 * A project's 사이클 (Linear's cycles list): the newest first, each a row on a rail of their start days, with its progress
 * ring, where it stands (진행 중 · 다음 · 계획 · 마침), how much of its scope is done and how big it is. A row opens the
 * project's work items narrowed to the cycle; its menu changes the name, aim and days, starts an upcoming one today,
 * finishes it (passing what is left on) or deletes it. How cycles run is set in 설정 · 사이클.
 */
export function ProjectCyclesPage({ crumbs }: { crumbs: Crumb[] }) {
  const { key = '' } = useParams({ strict: false }) as { key?: string };
  const navigate = useNavigate();
  const client = useQueryClient();
  // 사이클 설정은 그 프로젝트의 관리자.
  const isAdmin = useProjectCan(key).manage;
  const cycles = useQuery(cyclesOptions(key));
  const [editing, setEditing] = useState<'new' | Cycle | null>(null);
  const [finishing, setFinishing] = useState<Cycle | null>(null);
  const [removing, setRemoving] = useState<Cycle | null>(null);
  const list = cycles.data?.cycles ?? [];
  const canWrite = !!cycles.data?.canWrite;
  const remove = useMutation({
    mutationFn: (cycle: Cycle) => deleteCycle(key, cycle),
    onSuccess: async () => { setRemoving(null); await refreshWorkItems(client); },
  });
  const startToday = useMutation({
    mutationFn: (cycle: Cycle) => editCycle(key, cycle, { name: cycle.name!, goal: cycle.goal, startDate: iso(new Date()), endDate: cycle.endDate! }),
    onSettled: () => refreshWorkItems(client),
  });
  const open = (cycle: Cycle) => void navigate({ href: `/workspace/projects/${encodeURIComponent(key)}/work-items?custom=1&filter.cycle=${cycle.id}` });
  const rows = [...list].reverse();
  const next = list.find(cycle => cycle.state === 'UPCOMING');
  const settingsHref = `/workspace/projects/${encodeURIComponent(key)}/settings/cycles`;
  const body = () => {
    if (cycles.error) return isNotFound(cycles.error) ? <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" /> : <PageState kind="error" title="사이클을 불러오지 못했습니다" description={cycles.error.message} />;
    if (!cycles.data) return null;
    if (list.length === 0) return <PageState kind="empty" title="아직 사이클이 없습니다"
      action={isAdmin && !cycles.data.settings?.isEnabled
        ? <Button variant="outline" nativeButton={false} render={<Link to={settingsHref} />}>사이클 설정</Button>
        : canWrite ? <Button variant="outline" onClick={() => setEditing('new')}>새 사이클</Button> : undefined} />;
    return <ul aria-label="사이클" className="flex flex-col py-2">
      {rows.map((cycle, index) => {
        const state = cycle.state ?? 'UPCOMING';
        return <CycleRow key={cycle.id} cycle={cycle} isFirst={index === 0} label={stateOf(cycle, next)} onOpen={() => open(cycle)}
          actions={canWrite ? [
            { label: '이름·목표·날짜 바꾸기', icon: PenSquareIcon, onSelect: () => setEditing(cycle) },
            ...(state === 'UPCOMING' ? [{ label: '오늘 시작', icon: CalendarIcon, onSelect: () => startToday.mutate(cycle) }] : []),
            ...(state !== 'COMPLETED' ? [{ label: '사이클 마치기', icon: CircleCheckIcon, onSelect: () => setFinishing(cycle) }] : []),
            { label: '지우기', icon: Trash2Icon, onSelect: () => { remove.reset(); setRemoving(cycle); } },
          ] : undefined} />;
      })}
    </ul>;
  };
  return <Page crumbs={pageCrumbs(crumbs)} create={canWrite ? { label: '새 사이클', onClick: () => setEditing('new') } : undefined}
    actions={isAdmin ? <Button variant="ghost" size="icon" aria-label="사이클 설정" title="사이클 설정" nativeButton={false} render={<Link to={settingsHref} />}>
      <SettingsIcon />
    </Button> : undefined}>
    {startToday.error ? <p role="alert" className="px-4 pt-3 text-sm text-destructive">{startToday.error.message}</p> : null}
    {body()}
    {editing ? <CycleFormDialog projectKey={key} cycle={editing === 'new' ? undefined : editing} cycles={list} onClose={() => setEditing(null)} /> : null}
    {finishing ? <FinishCycleDialog projectKey={key} cycle={finishing} cycles={list} onClose={() => setFinishing(null)} /> : null}
    <ConfirmDialog open={!!removing} onOpenChange={isOpen => { if (!isOpen && !remove.isPending) setRemoving(null); }}
      title={removing ? `'${removing.name}' 사이클을 지울까요?` : '사이클을 지울까요?'}
      description={remove.error?.message ?? '업무는 지우지 않고 사이클에서만 뺍니다.'}
      action={{ label: '지우기', onAction: () => { if (removing) remove.mutate(removing); }, isPending: remove.isPending }} />
  </Page>;
}
