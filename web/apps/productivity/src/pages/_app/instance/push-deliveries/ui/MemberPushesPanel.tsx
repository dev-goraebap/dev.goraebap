import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@goraebap/ui-react/compact/button';
import { BellIcon } from '@/shared/ui/kit/icon';
import { SettingsSection } from '@/shared/ui/kit/settings';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { PUSH_KEY, pushMemberOptions, sendMemberTest, type PushMember } from '../api/push';
import { formatPushMoment } from '../model/push-format';
import { PushPanelRow } from './PushPanelRow';
import { PushStatusToken } from './PushStatusToken';
import { PushToneBadge } from './PushToneBadge';

/**
 * One member's pushes: every device they had (those still taking pushes first, ended ones quiet), then their latest
 * pushes with the device, the outcome, the push service's answer and the tries. A test push checks their devices; its
 * outcome shows here a moment later.
 */
export function MemberPushesPanel({ member }: { member: PushMember }) {
  const client = useQueryClient();
  const detail = useQuery(pushMemberOptions(member.id));
  const test = useMutation({ mutationFn: () => sendMemberTest(member.id), onSettled: () => client.invalidateQueries({ queryKey: PUSH_KEY }) });
  const data = detail.data;
  if (!data) return detail.isError
    ? <p className="text-sm text-destructive" role="alert">{detail.error.message}</p>
    : <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  return <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-2">
      <Button variant="secondary" className="self-start" disabled={test.isPending || data.devices.every(device => device.expiredAt)} onClick={() => test.mutate()}>
        {test.isPending ? <Spinner data-icon="inline-start" /> : <BellIcon data-icon="inline-start" />}
        테스트 알림 보내기
      </Button>
      {test.isSuccess ? <p className="text-sm text-muted-foreground" role="status">기기 {test.data.devices}대에 보냈습니다.</p> : null}
      {test.error ? <p className="text-sm text-destructive" role="alert">{test.error.message}</p> : null}
    </div>
    <SettingsSection title={`기기 ${data.devices.filter(device => !device.expiredAt).length}대`}>
      {data.devices.length === 0
        ? <PushPanelRow label="알림을 켠 기기가 없습니다" />
        : data.devices.map(device => <PushPanelRow key={device.id} label={device.deviceName ?? '이름 없는 기기'}
          description={`${formatPushMoment(device.createdAt)} 추가 · 마지막 접속 ${formatPushMoment(device.lastSeenAt)}${device.expiredAt ? ` · ${formatPushMoment(device.expiredAt)} 끝남` : ''}`}
          end={device.expiredAt ? <PushToneBadge label="끝남" tone="gray" /> : <PushToneBadge label="받는 중" tone="green" />} />)}
    </SettingsSection>
    <SettingsSection title="최근 알림">
      {data.deliveries.length === 0
        ? <PushPanelRow label="아직 보낸 알림이 없습니다" />
        : data.deliveries.map(delivery => <PushPanelRow key={delivery.id} label={`${delivery.test ? '[테스트] ' : ''}${delivery.title}`}
          description={[
            `${formatPushMoment(delivery.createdAt)}${delivery.deviceName ? ` · ${delivery.deviceName}` : ''}${delivery.attempts > 1 ? ` · ${delivery.attempts}번 시도` : ''}${delivery.httpStatus ? ` · HTTP ${delivery.httpStatus}` : ''}`,
            delivery.error && delivery.status !== 'SENT' ? delivery.error : '',
          ].filter(Boolean).join('\n')}
          end={<PushStatusToken status={delivery.status} />} />)}
    </SettingsSection>
  </div>;
}
