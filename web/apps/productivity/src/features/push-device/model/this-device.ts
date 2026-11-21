const KEY = 'cowork-push-device';

/**
 * Which of the member's devices this browser is, as the server named it when this browser last subscribed. Kept in
 * this browser only; without storage the list simply marks no device as this one.
 */
export const thisDeviceId = (): string | null => {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
};

export const rememberThisDevice = (id: string | null) => {
  try {
    if (id) window.localStorage.setItem(KEY, id); else window.localStorage.removeItem(KEY);
  } catch { /* Storage can be disabled; the device still works. */ }
};
