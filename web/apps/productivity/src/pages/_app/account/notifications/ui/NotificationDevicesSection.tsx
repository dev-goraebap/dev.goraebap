import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { pushDevicesOptions, pushKeys, removeDevice, thisDeviceId, type PushDevice } from '@/features/push-device';
import { Badge } from '@goraebap/ui-react/compact/badge';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { MonitorIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { Tooltip, TooltipContent, TooltipTrigger } from '@goraebap/ui-react/compact/tooltip';
import { momentText, pushStatusLabels } from '../model/push-labels';
import { NotificationIconRow } from './NotificationIconRow';

/** A device's line: when it was added, and how its last push went (a failure with its reason). */
function describe(device: PushDevice) {
  const last = device.lastPush;
  const pushed = last ? `마지막 알림 ${momentText(last.at)} ${pushStatusLabels[last.status] ?? last.status}` : '아직 받은 알림 없음';
  const failed = last && (last.status === 'FAILED' || last.status === 'GONE') && last.error ? ` · ${last.error}` : '';
  return `${momentText(device.createdAt)} 추가 · ${pushed}${failed}`;
}

/** The member's devices taking pushes, this one marked; one no longer used is removed after asking. */
export function NotificationDevicesSection() {
  const client = useQueryClient();
  const devices = useQuery(pushDevicesOptions());
  const [removing, setRemoving] = useState<PushDevice | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => removeDevice(id),
    onSuccess: () => setRemoving(null),
    onSettled: () => client.invalidateQueries({ queryKey: pushKeys.all }),
  });
  const mine = thisDeviceId();
  const list = devices.data ?? [];
  return <>
    <SettingsSection title={devices.data ? `알림 받는 기기 ${list.length}대` : '알림 받는 기기'}>
      {devices.isError ? <SettingsRow label="기기를 불러오지 못했습니다" description={devices.error.message} hasValue={false} />
        : !devices.data ? <SettingsRow label="불러오는 중…" hasValue={false} />
          : list.length === 0 ? <SettingsRow label="아직 알림을 받는 기기가 없습니다" hasValue={false} />
            : list.map(device => (
              <NotificationIconRow key={device.id} icon={<MonitorIcon />} label={device.deviceName ?? '이름 없는 기기'} description={describe(device)}>
                {device.id === mine ? <Badge variant="secondary">이 기기</Badge> : null}
                <Tooltip>
                  <TooltipTrigger render={
                    <Button variant="ghost" size="icon-sm" aria-label={`${device.deviceName ?? '기기'} 삭제`} className="max-md:size-11"
                      onClick={() => { remove.reset(); setRemoving(device); }}>
                      <Trash2Icon />
                    </Button>
                  } />
                  <TooltipContent>삭제</TooltipContent>
                </Tooltip>
              </NotificationIconRow>
            ))}
    </SettingsSection>
    <ConfirmDialog open={!!removing} onOpenChange={open => { if (!open) { setRemoving(null); remove.reset(); } }}
      title={`${removing?.deviceName ?? '이 기기'}를 삭제할까요?`}
      description={remove.error?.message ?? '이 기기에는 더 이상 푸시 알림이 가지 않습니다. 그 기기에서 다시 켜면 돌아옵니다.'}
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (removing) remove.mutate(removing.id); } }} />
  </>;
}
