import type { QueryClient } from '@tanstack/react-query';
import { currentSubscription, notificationPermission, pushSupport, subscribePush } from '../lib/push';
import { pushConfigOptions, saveDevice } from '../api/push';
import { rememberThisDevice } from './this-device';

/**
 * Tells the server again that this browser takes pushes, which marks the device seen and moves it to whoever is signed
 * in now (the same browser may have been turned on under another account); a subscription made for an old server key
 * is replaced. Returns this device's id, or null when push is not on here.
 */
export async function claimThisDevice(client: QueryClient): Promise<string | null> {
  if (pushSupport() !== 'ready' || notificationPermission() !== 'granted') return null;
  const config = await client.query(pushConfigOptions());
  const existing = await currentSubscription();
  if (!config.enabled || !config.publicKey || !existing) return null;
  const device = await saveDevice(await subscribePush(config.publicKey));
  rememberThisDevice(device.id);
  return device.id;
}
