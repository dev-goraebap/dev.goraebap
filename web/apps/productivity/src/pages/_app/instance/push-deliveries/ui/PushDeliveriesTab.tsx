import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@goraebap/ui-react/compact/alert';
import { Button } from '@goraebap/ui-react/compact/button';
import { TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { WithPanel } from '@/shared/ui/kit/side-panel';
import { PersonAvatar } from '@/shared/ui/person';
import { pushMembersOptions, pushSummaryOptions, type PushMember } from '../api/push';
import { formatPushMoment, PUSH_OPENS_ROW, PUSH_SURFACE } from '../model/push-format';
import { MemberPushesPanel } from './MemberPushesPanel';
import { PushMembersTable } from './PushMembersTable';
import { PushStatusToken } from './PushStatusToken';

const ROW = 'relative bg-background hover:bg-row-hover data-[state=selected]:bg-muted';

/**
 * 발송 현황: the week at a glance leads (members who get pushes, delivered, failed, no device), then every working member
 * by name with their devices and latest push, narrowed to those with a failure or without a device. A member opens
 * their devices and every push with the push service's answer, and a test push.
 */
export function PushDeliveriesTab({ listing, isNarrowed, onClear, opened, onOpen }: {
  listing: { q?: string; state?: string }; isNarrowed: boolean; onClear: () => void; opened: PushMember | null; onOpen: (member: PushMember | null) => void;
}) {
  const isMobile = useIsMobile();
  const summary = useQuery(pushSummaryOptions());
  const members = useQuery(pushMembersOptions(listing));
  const s = summary.data;
  const tiles = s ? [
    { key: 'members', label: '알림 켠 구성원', value: `${s.membersWithDevice}`, unit: `/ ${s.workingMembers}명`, note: `기기 ${s.activeDevices}대` },
    { key: 'sent', label: '전달됨', value: `${s.sent}`, unit: '건' },
    { key: 'failed', label: '실패', value: `${s.failed + s.gone}`, unit: '건', note: s.gone > 0 ? `구독 끝남 ${s.gone}건 포함` : undefined, alert: s.failed + s.gone > 0 },
    { key: 'noDevice', label: '기기 없어 못 보냄', value: `${s.noDevice}`, unit: '건', note: s.muted > 0 ? `꺼 둔 알림 ${s.muted}건 별도` : undefined },
  ] : [];
  const list = members.data ?? [];
  const rows = () => {
    if (members.isPending) return null;
    if (members.isError) return <PageState kind="error" isCompact title="구성원별 알림을 불러오지 못했습니다" description={members.error.message}
      action={<Button variant="secondary" onClick={() => void members.refetch()}>다시 시도</Button>} />;
    if (list.length === 0) return isNarrowed
      ? <PageState kind="search" isCompact title="조건에 맞는 구성원이 없습니다"
        action={<Button variant="secondary" onClick={onClear}>조건 지우기</Button>} />
      : <PageState kind="empty" isCompact title="재직 중인 구성원이 없습니다" />;
    return isMobile
      ? <ul aria-label="구성원별 알림" className="flex flex-col border-t">
        {list.map(member => <li key={member.id} data-state={opened?.id === member.id ? 'selected' : undefined}
          className={cn(ROW, 'flex items-center gap-3 border-b px-4 py-3')}>
          <PersonAvatar id={member.id} name={member.name} size={32} isStatic />
          <span className="flex min-w-0 flex-1 flex-col">
            <button type="button" className={cn(PUSH_OPENS_ROW, 'font-medium')} onClick={() => onOpen(member)}>{member.name}</button>
            <span className="truncate text-sm text-muted-foreground">
              {`${member.devices > 0 ? `기기 ${member.devices}대` : '기기 없음'}${member.failed > 0 ? ` · 실패 ${member.failed}` : ''}`}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-0.5">
            <PushStatusToken status={member.lastStatus} />
            {member.lastPushAt ? <span className="text-xs text-muted-foreground tabular-nums">{formatPushMoment(member.lastPushAt)}</span> : null}
          </span>
        </li>)}
      </ul>
      : <PushMembersTable rows={list} opened={opened} onOpen={onOpen} />;
  };
  return <WithPanel title={opened?.name}
    panel={opened ? <MemberPushesPanel member={opened} /> : undefined} onClose={() => onOpen(null)}>
    <div className="flex flex-col gap-4 py-4">
      {s ? <div className="flex flex-col gap-3 px-4">
        {!s.configured ? <Alert>
          <TriangleAlertIcon className="text-mark-high" />
          <AlertTitle>푸시 알림이 꺼져 있습니다</AlertTitle>
          <AlertDescription>서버에 VAPID 키(VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY)가 설정되지 않아 브라우저 푸시를 보내지 않고 있습니다. 앱 안 알림은 그대로 갑니다.</AlertDescription>
        </Alert> : null}
        <h2 className="text-sm font-medium text-muted-foreground">최근 7일</h2>
        <dl className="m-0 grid grid-cols-4 gap-3 max-md:grid-cols-2">{tiles.map(tile => <div key={tile.key}
          className={cn(PUSH_SURFACE, 'flex flex-col gap-1', tile.alert && 'border-destructive/45')}>
          <dt className="text-sm text-muted-foreground">{tile.label}</dt>
          <dd className="m-0 flex flex-wrap items-baseline gap-x-1">
            <span className={cn('text-2xl leading-tight font-bold tabular-nums max-md:text-base', tile.alert && 'text-destructive')}>{tile.value}</span>
            <span className="text-sm text-muted-foreground">{tile.unit}</span>
          </dd>
          {tile.note ? <p className="text-sm text-muted-foreground">{tile.note}</p> : null}
        </div>)}</dl>
      </div> : null}
      {rows()}
    </div>
  </WithPanel>;
}
