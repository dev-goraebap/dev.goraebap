import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cyclesOptions, refreshWorkItems, saveCycleSettings, type CycleSettings } from '@/entities/work-item';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { Switch } from '@/shared/ui/kit/switch';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ChoiceSelect } from '@/shared/ui/settings';

type Crumb = { label: string; href?: string; icon?: string };

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const weekday = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
const WEEKS = [1, 2, 3, 4, 6, 8].map(weeks => ({ value: String(weeks), label: `${weeks}주` }));
const STARTS = WEEKDAYS.map((name, index) => ({ value: String(index + 1), label: name }));
const UPCOMING = [0, 1, 2, 3, 4, 6].map(count => ({ value: String(count), label: count === 0 ? '만들지 않음' : `${count}개` }));
const DESCRIPTION = '정한 기간으로 업무를 묶어 리듬을 만듭니다. 기간이 끝나면 남은 업무를 다음 사이클로 넘기고, 다음 사이클을 미리 만들어 둡니다.';

/**
 * 설정 · 사이클 (Linear's cycle settings): whether the project runs cycles, how long one is and the day it starts, how many
 * next ones are kept ready, and whether work items that get under way or done join the cycle under way. Each change
 * saves at once; turned on, the cycles due are made then.
 */
export function ProjectCycleSettingsPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey: string }) {
  const client = useQueryClient();
  const cycles = useQuery(cyclesOptions(projectKey));
  const save = useMutation({
    mutationFn: (settings: CycleSettings) => saveCycleSettings(projectKey, settings),
    onSettled: () => refreshWorkItems(client),
  });
  const page = { crumbs: pageCrumbs(crumbs), title: '사이클', description: DESCRIPTION };
  if (cycles.isError) return <SettingsPage {...page}>
    <PageState kind="error" isCompact title="사이클 설정을 불러오지 못했습니다" description={cycles.error.message} />
  </SettingsPage>;
  const settings = save.isPending && save.variables ? save.variables : cycles.data?.settings;
  if (!settings) return <SettingsPage {...page}>{null}</SettingsPage>;
  const change = (patch: Partial<CycleSettings>) => save.mutate({ ...settings, ...patch } as CycleSettings);
  const isOff = !settings.isEnabled || save.isPending;
  const next = cycles.data?.cycles?.find(cycle => cycle.state === 'UPCOMING');
  return <SettingsPage {...page}>
    {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
    <SettingsSection title="사용">
      <SettingsRow label="사이클 쓰기">
        <Switch aria-label="사이클 쓰기" checked={!!settings.isEnabled} disabled={save.isPending} onCheckedChange={isEnabled => change({ isEnabled })} />
      </SettingsRow>
    </SettingsSection>
    <SettingsSection title="일정">
      <SettingsRow wide label="사이클 기간">
        <ChoiceSelect label="사이클 기간" options={WEEKS} value={String(settings.weeks)} disabled={isOff} onChange={value => change({ weeks: Number(value) })} />
      </SettingsRow>
      <SettingsRow wide label="시작 요일" description={next?.startDate ? `다음 사이클은 ${weekday(next.startDate)}에 시작합니다.` : undefined}>
        <ChoiceSelect label="시작 요일" options={STARTS} value={String(settings.startDay)} disabled={isOff} onChange={value => change({ startDay: Number(value) })} />
      </SettingsRow>
      <SettingsRow wide label="미리 만들 사이클">
        <ChoiceSelect label="미리 만들 사이클" options={UPCOMING} value={String(settings.upcoming)} disabled={isOff} onChange={value => change({ upcoming: Number(value) })} />
      </SettingsRow>
    </SettingsSection>
    <SettingsSection title="자동으로 넣기">
      <SettingsRow label="진행 중이 된 업무">
        <Switch aria-label="진행 중이 된 업무" checked={!!settings.addsStarted} disabled={isOff} onCheckedChange={addsStarted => change({ addsStarted })} />
      </SettingsRow>
      <SettingsRow label="완료된 업무">
        <Switch aria-label="완료된 업무" checked={!!settings.addsCompleted} disabled={isOff} onCheckedChange={addsCompleted => change({ addsCompleted })} />
      </SettingsRow>
    </SettingsSection>
  </SettingsPage>;
}
