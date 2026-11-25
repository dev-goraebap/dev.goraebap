import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { claimThisDevice, deviceName, pushKeys, sendTestPush, stateTexts, useThisDevice } from '@/features/push-device';
import { Button } from '@goraebap/ui-react/compact/button';
import { BellIcon, SentIcon } from '@/shared/ui/kit/icon';
import { SettingsSection } from '@/shared/ui/kit/settings';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { Switch } from '@goraebap/ui-react/components/switch';
import { NotificationIconRow } from './NotificationIconRow';

/**
 * This browser's push: its name and state with one switch to turn it on or off and what to do when it cannot be on,
 * then a test push once it is. The test's outcome shows on the device list as soon as it is known.
 */
export function ThisDeviceSection() {
  const client = useQueryClient();
  const { state, turnOn, turnOff, deviceId } = useThisDevice();
  const [tested, setTested] = useState(false);
  const test = useMutation({
    // This browser may still be listed under the account that turned it on; it becomes this member's first.
    mutationFn: async () => sendTestPush(await claimThisDevice(client).catch(() => null) ?? deviceId ?? undefined),
    onSuccess: async () => { setTested(true); await client.invalidateQueries({ queryKey: pushKeys.all }); },
  });
  const text = stateTexts[state];
  const isOn = state === 'on';
  const canSwitch = state === 'on' || state === 'off';
  const isBusy = turnOn.isPending || turnOff.isPending;
  const error = turnOn.error ?? turnOff.error ?? test.error;
  return (
    <SettingsSection title="이 기기" note={error?.message}>
      <NotificationIconRow icon={<BellIcon />} label="이 기기에서 알림 받기" description={<>
        <span>{deviceName()} · {text.summary}</span>
        {text.help ? <span>{text.help}</span> : null}
      </>}>
        {isBusy ? <Spinner aria-label="바꾸는 중" /> : null}
        <Switch appearance="compact" aria-label="이 기기에서 알림 받기" checked={isOn} disabled={!canSwitch || isBusy}
          onCheckedChange={next => { setTested(false); if (next) turnOn.mutate(); else turnOff.mutate(); }} />
      </NotificationIconRow>
      {isOn ? (
        <NotificationIconRow icon={<SentIcon />} label="테스트 알림" description={tested ? '보냈습니다.' : undefined}>
          <Button variant="secondary" size="sm" disabled={test.isPending} onClick={() => test.mutate()}>
            {test.isPending ? <Spinner data-icon="inline-start" /> : null}보내기
          </Button>
        </NotificationIconRow>
      ) : null}
    </SettingsSection>
  );
}
