import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { pushSupport } from '../lib/push';
import { claimThisDevice } from '../model/claim-this-device';

/**
 * Keeps this browser's push in step once the member is signed in, drawing nothing: the workspace and the onboarding
 * both hold it, so the device is the signed-in member's before either screen tests it (claimThisDevice). A pressed
 * notification's screen is opened here without reloading the app.
 */
export function PushSync() {
  const client = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => { void claimThisDevice(client).catch(() => undefined); }, [client]);
  useEffect(() => {
    if (pushSupport() !== 'ready') return;
    const open = (event: MessageEvent) => {
      const url = (event.data as { type?: string; url?: unknown } | null)?.type === 'open' ? (event.data as { url?: unknown }).url : null;
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) void navigate({ href: url });
    };
    navigator.serviceWorker.addEventListener('message', open);
    return () => navigator.serviceWorker.removeEventListener('message', open);
  }, [navigate]);
  return null;
}
