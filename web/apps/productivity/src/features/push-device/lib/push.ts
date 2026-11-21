/**
 * The browser's side of Web Push (client/'s shared/lib/push): whether this browser can take pushes and has been allowed
 * to show them, the service worker that shows them (/sw.js, served by the app; v2 has none yet), and this browser's
 * subscription for a VAPID key. Nothing here talks to the server.
 */

/** unsupported: no service worker or push here; insecure: not HTTPS; ios: an iPhone or iPad browser tab. */
export type PushSupport = 'ready' | 'unsupported' | 'insecure' | 'ios';

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  // An iPhone takes pushes only in a web app added to its home screen, which this service does not offer yet.
  if (isIos() && !capable) return 'ios';
  return capable ? 'ready' : 'unsupported';
}

/** Whether the member allowed notifications here: granted, denied (only the browser's settings can undo it), or not asked. */
export const notificationPermission = (): NotificationPermission => ('Notification' in window ? Notification.permission : 'denied');

/** The service worker that shows pushes, registered once and reused. */
export const pushRegistration = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready);

export async function currentSubscription(): Promise<PushSubscription | null> {
  return (await pushRegistration()).pushManager.getSubscription();
}

const toKey = (base64: string) => {
  const raw = atob(base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
};

const sameKey = (subscription: PushSubscription, key: Uint8Array) => {
  const current = subscription.options.applicationServerKey;
  if (!current) return true;
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((value, index) => value === key[index]);
};

/**
 * This browser's subscription for the key, asking the member to allow notifications first when they have not been
 * asked. A subscription made for another key (a server whose key changed) is replaced. Call it from a press.
 */
export async function subscribePush(publicKey: string): Promise<PushSubscription> {
  // Asked first, while the press that called this still counts as the member's own act, as some browsers require.
  if (Notification.permission === 'default' && (await Notification.requestPermission()) !== 'granted')
    throw new Error('알림 권한을 허용하지 않았습니다.');
  if (Notification.permission === 'denied') throw new Error('브라우저에서 이 사이트의 알림이 차단되어 있습니다.');
  const registration = await pushRegistration();
  const key = toKey(publicKey);
  const existing = await registration.pushManager.getSubscription();
  if (existing && sameKey(existing, key)) return existing;
  if (existing) await existing.unsubscribe();
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

/** Ends this browser's subscription; the endpoint it had, if any. */
export async function unsubscribePush(): Promise<string | null> {
  const subscription = await currentSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription.endpoint;
}

/** What the server keeps of a subscription. */
export function subscriptionBody(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return { endpoint: subscription.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' };
}

/** A short name for this device from its browser, such as 'Chrome · Windows', so the member can tell devices apart. */
export function deviceName(agent = navigator.userAgent): string {
  const browser = /Edg\//.test(agent) ? 'Edge' : /Whale\//.test(agent) ? 'Whale' : /SamsungBrowser\//.test(agent) ? 'Samsung Internet'
    : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : '브라우저';
  const system = /iPhone/.test(agent) ? 'iPhone' : /iPad/.test(agent) ? 'iPad' : /Android/.test(agent) ? 'Android'
    : /Windows/.test(agent) ? 'Windows' : /Mac OS X|Macintosh/.test(agent) ? 'Mac' : /Linux/.test(agent) ? 'Linux' : '기기';
  return `${browser} · ${system}`;
}
