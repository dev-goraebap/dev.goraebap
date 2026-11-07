import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import type { JSONContent } from '@tiptap/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { CatalogShell } from './CatalogShell';
import { CreationForm, CreationSurface } from './CreationForm';
import { Page } from './Page';
import { RichTextBody } from './RichTextBody';
import { useOpenPanel, useRoutedPanel } from './RoutedPanel';

const Draft = createContext<{
  title: string; setTitle: (value: string) => void; body?: JSONContent; setBody: (value: JSONContent) => void;
  category: boolean; setCategory: (value: boolean) => void;
} | null>(null);

function Frame() {
  const location = useLocation();
  return <VStack className="reference-catalog">
    <HStack as="output" aria-label="라우팅 상태" className="reference-route-state" gap={3} wrap="wrap">
      <Text>내부 경로 {location.pathname}</Text><Text>표시 경로 {location.maskedLocation?.pathname ?? location.pathname}</Text>
    </HStack>
    <CatalogShell isDetail={location.pathname.endsWith('/new')}><Outlet /></CatalogShell>
  </VStack>;
}
function Form({ surface, close, expand }: { surface: 'dialog' | 'page'; close: () => void; expand?: () => void }) {
  const draft = useContext(Draft)!;
  return <CreationSurface surface={surface} close={close} expand={expand} submit={close} disabled={!draft.title.trim() || !draft.category}>
    <CreationForm title={draft.title} onTitle={draft.setTitle} body={<RichTextBody value={draft.body} onChange={draft.setBody} />}
      properties={<Button label={draft.category ? '분류 · 기본' : '분류 (필수)'} variant="view"
        onClick={() => draft.setCategory(!draft.category)} />} />
  </CreationSurface>;
}
function List() {
  const open = useOpenPanel();
  const panel = useRoutedPanel();
  const router = useRouter();
  const isPhone = useMediaQuery('(width < 64rem)');
  const { href, expand } = panel;
  useEffect(() => { if (isPhone && href) expand(); }, [isPhone, href, expand]);
  return <>
    <Page crumbs={[{ label: '목록' }]} actions={<Button label="새 항목" variant="create" onClick={() => open('/items/new')} />}>
      <VStack padding={4} gap={3}><Text>아직 항목이 없습니다.</Text>
        <HStack gap={2}><Button label="뒤로가기" variant="secondary" onClick={() => router.history.back()} />
          <Button label="앞으로가기" variant="secondary" onClick={() => router.history.forward()} /></HStack>
      </VStack>
    </Page>
    {panel.href && !isPhone ? <Form surface="dialog" close={panel.close} expand={panel.expand} /> : null}
  </>;
}
function Direct() {
  const navigate = useNavigate();
  return <Form surface="page" close={() => void navigate({ href: '/items', replace: true })} />;
}
export function RoutingPattern({ direct = false }: { direct?: boolean }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<JSONContent>();
  const [category, setCategory] = useState(false);
  const [router] = useState(() => {
    const root = createRootRoute({ component: Frame });
    const list = createRoute({ getParentRoute: () => root, path: '/items', component: List,
      validateSearch: (search: Record<string, unknown>) => typeof search.panel === 'string' ? { panel: search.panel } : {} });
    const form = createRoute({ getParentRoute: () => root, path: '/items/new', component: Direct });
    return createRouter({ routeTree: root.addChildren([list, form]), unmaskOnReload: true,
      history: createMemoryHistory({ initialEntries: [direct ? '/items/new' : '/items'] }) });
  });
  return <Draft value={{ title, setTitle, body, setBody, category, setCategory }}><RouterProvider router={router} /></Draft>;
}
