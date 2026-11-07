import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';

/** The list stays mounted while its masked address points at a directly accessible form. */
export function useOpenPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPhone = useMediaQuery('(width < 64rem)');
  return (href: string) => {
    if (isPhone) return void navigate({ href });
    const target = new URL(href, 'https://workspace.invalid');
    void navigate({
      to: location.pathname, search: { ...location.search, panel: href }, state: { openedPanel: true } as never,
      mask: { to: target.pathname, search: Object.fromEntries(target.searchParams), state: { openedPanel: true } as never },
    });
  };
}

export function useRoutedPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const { panel, ...rest } = location.search as Record<string, unknown>;
  const openedHere = !!(location.state as unknown as Record<string, unknown>).openedPanel;
  return {
    href: typeof panel === 'string' && panel.startsWith('/') ? panel : undefined,
    close: () => openedHere ? router.history.back() : void navigate({ to: location.pathname, search: rest, replace: true }),
    expand: () => typeof panel === 'string' && void navigate({ href: panel, replace: true }),
  };
}
