import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { directoryAgentsOptions, orgChartOptions } from '@/entities/organization';
import { sessionOptions } from '@/shared/auth';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { UserIcon } from '@/shared/ui/kit/icon';
import { Mark } from '@/shared/ui/mark-picker';
import { PersonAvatar } from '@/shared/ui/person';

/**
 * A person's profile, laid out as 내 정보 is: their picture and name, their work email and their active agent
 * identities. Someone not working any more shows by name alone. One's own profile leads to 내 정보.
 */
export function PersonProfile({ employeeId, name }: { employeeId: string; name?: string }) {
  const chart = useQuery(orgChartOptions());
  const session = useQuery(sessionOptions());
  const people = chart.data?.people ?? [];
  const person = people.find(item => item.id === employeeId);
  const agents = useQuery({ ...directoryAgentsOptions(employeeId), enabled: !!person });
  const isSelf = session.data?.id === employeeId;
  if (chart.isPending) return null;
  if (!person) return <div className="flex flex-col gap-1 p-4">
    <h2 className="text-base font-semibold">{name ?? '구성원'}</h2>
    <p className="text-muted-foreground">{chart.isError ? '프로필을 불러오지 못했습니다.' : '재직 중인 구성원만 프로필을 볼 수 있습니다.'}</p>
  </div>;
  const facts = [['업무 이메일', person.workEmail]] as const;
  return <div className="flex flex-col gap-6">
    <section className="flex items-center gap-4 rounded-xl bg-muted p-4">
      <PersonAvatar id={person.id} name={person.name} size={72} isStatic />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="truncate text-base font-semibold">{person.name}</h2>
        {isSelf ? <div className="flex flex-wrap gap-1"><Badge variant="label">나</Badge></div> : null}
      </div>
    </section>
    <dl className="flex flex-col text-sm">
      {facts.map(([label, value]) => <div key={label} className="flex min-h-9 items-center gap-3">
        <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
        <dd className={value ? 'min-w-0 truncate' : 'text-muted-foreground'}>
          {value && label === '업무 이메일' ? <a href={`mailto:${value}`} className="underline-offset-4 hover:underline">{value}</a> : value || '-'}
        </dd>
      </div>)}
    </dl>
    <section aria-label="에이전트" className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">에이전트</h3>
      {agents.isError ? <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">에이전트를 불러오지 못했습니다.</p>
        <Button variant="ghost" size="sm" onClick={() => void agents.refetch()}>다시 시도</Button>
      </div> : agents.isPending ? <p className="text-sm text-muted-foreground">불러오는 중</p>
        : agents.data.length === 0 ? <p className="text-sm text-muted-foreground">사용 중인 에이전트가 없습니다.</p>
          : <ul className="flex flex-col divide-y">{agents.data.map(agent => <li key={agent.id} className="flex min-h-10 items-center gap-3 py-1.5">
            <Mark isCircular icon={agent.icon ?? 'agent'} color={agent.color} letter={agent.name ?? '에이전트'} size="md" />
            <span className="min-w-0 truncate">{agent.name ?? '에이전트'}</span>
          </li>)}</ul>}
    </section>
    {isSelf
      ? <div className="flex justify-end">
        <Button variant="secondary" size="sm" nativeButton={false} render={<Link to="/account/profile" />}><UserIcon data-icon="inline-start" />내 정보로</Button>
      </div>
      : null}
  </div>;
}
