/*
 * The service worker for browser push. A push carries { title, body, url, tag } as JSON: it shows as a notification
 * (one per tag, so a notice sent to two devices of the same browser profile does not pile up) unless the app is on
 * screen, and pressing it focuses an open window of this app and asks it to go to url, or opens one there. Only paths
 * inside the app are followed. It caches nothing; the app works as before without it.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

/*
 * While a window of this app is visible and focused, the page shows the notice as a toast, so no OS notification is
 * shown; that window is handed the push, in case its event stream is slow. A test push (test: true) always shows as an
 * OS notification, since seeing one arrive on this device is what the test is for.
 * Chrome lets a userVisibleOnly push go without a notification while a visible tab shows the origin
 * (push_messaging_notification_manager.cc), which a visible, focused window does; should it hide in between, Chrome
 * at worst shows its own generic notification.
 */
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : '' }; }
  const title = typeof data.title === 'string' && data.title ? data.title : '새 알림';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const onScreen = windows.find(client =>
      new URL(client.url).origin === self.location.origin && client.visibilityState === 'visible' && client.focused);
    if (onScreen && data.test !== true) {
      onScreen.postMessage({
        type: 'notice',
        tag: typeof data.tag === 'string' ? data.tag : undefined,
        body: typeof data.body === 'string' ? data.body : undefined,
        url: inApp(data.url),
      });
      return;
    }
    await self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      data: { url: inApp(data.url) },
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(inApp(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (open) {
      // The app moves there itself, keeping what it has loaded; it listens for this message.
      await open.focus();
      open.postMessage({ type: 'open', url: inApp(event.notification.data && event.notification.data.url) });
      return;
    }
    await self.clients.openWindow(url);
  })());
});

// A path inside the app ('/…' but not '//…'), else the notices screen.
function inApp(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/inbox';
}
