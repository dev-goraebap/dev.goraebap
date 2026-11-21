import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { currentSubscription, notificationPermission, pushSupport, subscribePush, unsubscribePush } from '../lib/push';
import { pushConfigOptions, pushKeys, removeDevice, saveDevice } from '../api/push';
import { rememberThisDevice, thisDeviceId } from './this-device';

/**
 * Where this browser stands with push, in the order a member would sort it out: still checking; the server has no key;
 * the browser cannot (or only as a home-screen app, or only over HTTPS); notifications blocked in the browser's
 * settings; off; or on.
 */
export type DeviceState = 'checking' | 'not-configured' | 'unsupported' | 'insecure' | 'ios' | 'blocked' | 'off' | 'on';

/**
 * This browser's push: its state, and turning it on (asking to allow notifications, subscribing with the server's key
 * and telling the server) or off (ending the subscription here and on the server).
 */
export function useThisDevice() {
  const client = useQueryClient();
  const config = useQuery(pushConfigOptions());
  const support = pushSupport();
  const [subscribed, setSubscribed] = useState<boolean | undefined>(support === 'ready' ? undefined : false);
  const [permission, setPermission] = useState(() => (support === 'ready' ? notificationPermission() : 'default'));
  useEffect(() => {
    if (support !== 'ready') return;
    let live = true;
    currentSubscription().then(found => { if (live) setSubscribed(!!found); }).catch(() => { if (live) setSubscribed(false); });
    return () => { live = false; };
  }, [support]);
  const refresh = () => client.invalidateQueries({ queryKey: pushKeys.all });
  const turnOn = useMutation({
    mutationFn: async () => {
      const subscription = await subscribePush(config.data?.publicKey ?? '');
      const device = await saveDevice(subscription);
      rememberThisDevice(device.id);
      return device;
    },
    onSettled: async () => {
      setPermission(notificationPermission());
      setSubscribed(!!(await currentSubscription().catch(() => null)));
      await refresh();
    },
  });
  const turnOff = useMutation({
    mutationFn: async () => {
      await unsubscribePush();
      const id = thisDeviceId();
      rememberThisDevice(null);
      if (id) await removeDevice(id).catch(() => undefined);
    },
    onSettled: async () => { setSubscribed(false); await refresh(); },
  });
  const state: DeviceState = config.isPending ? 'checking'
    : !config.data?.enabled ? 'not-configured'
      : support !== 'ready' ? support
        : permission === 'denied' ? 'blocked'
          : subscribed === undefined ? 'checking'
            : subscribed ? 'on' : 'off';
  return { state, turnOn, turnOff, deviceId: state === 'on' ? thisDeviceId() : null };
}
