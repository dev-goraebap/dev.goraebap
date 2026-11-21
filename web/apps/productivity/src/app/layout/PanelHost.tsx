import { lazyRouteComponent } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isPrepared, prepare, type Prep } from '@/shared/lib/prepare';
import { PanelLoading } from './PanelLoading';
import { useLoadingHold } from '@/shared/ui/page-loading/use-loading-hold';
import { sessionOptions } from '@/shared/auth';
import { useOpenPanel, usePanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { DialogPanel, swapDialog } from '@/shared/ui/kit/dialog';
import { workItemHref } from '@/entities/work-item';

import { GlobalSearch, useSearchSources } from '@/pages/_app/search';
import { ProfileSurface } from './ProfileSurface';
import { memberHref } from '@/shared/ui/person';

import { NewWorkItem } from '@/pages/_app/workspace/work-items/new';

const MEMBER = /^\/members\/([^/]+)$/;

const WorkItemPage = lazyRouteComponent(() => import('@/pages/_app/workspace/projects/$key/work-items/$number'), 'WorkItemPage');
const DocumentBoxPage = lazyRouteComponent(() => import('@/pages/_app/workspace/projects/$key/documents'), 'DocumentBoxPage');
const DocumentPagesManager = lazyRouteComponent(() => import('@/pages/_app/workspace/projects/$key/documents'), 'DocumentPagesManager');
const CreateProjectDialog = lazyRouteComponent(() => import('@/pages/_app/workspace/projects'), 'CreateProjectDialog');

/** 목록 위 대화상자로 여는 화면의 코드: 한가할 때 미리 받아 둔다(PanelHost). */
const LAZY_PANELS = [WorkItemPage, DocumentBoxPage, DocumentPagesManager, CreateProjectDialog];

/**
 * The pages a desktop opens as a dialog over the page it came from (shared/lib/panel), drawn from the panel's address:
 * each draws its own dialog (DetailSurface · FormDialog, or the legacy AppDialog until its page moves). 새 프로젝트(업무 사이드바의 +), 검색, a member's profile, 새 업무 (a project's or the workspace's), 새 일정 · 일정 고치기, 새 공지 · 공지 수정. A phone has none: an address carrying one goes to the page itself.
 */
export function PanelHost() {
  const { node, isLoading, href } = usePanelContent();
  const shown = useDialogSwap(node, href ? `${href}#${isLoading ? 'loading' : 'ready'}` : '');
  // 처음 여는 대화상자가 그 화면의 코드를 기다리느라(Suspense) 불러오는 중으로 떨어지지 않게, 한가할 때 미리 받아 둔다.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1500));
    idle(() => { for (const each of LAZY_PANELS) void each.preload?.(); });
  }, []);
  return shown;
}

/**
 * 목록 위 대화상자의 바꿔 끼우기(2026-11-15). 보이는 것(key: 주소 + 불러오는 중인지)이 바뀌면, 앞 대화상자를 한 프레임 더 그려 둔 채
 * 화면 전환(swapDialog)을 걸고 그 안에서 새 것으로 바꾼다: 앞 것이 흐려지는 동안 새 것이 진해지며 겹치고 틀의 크기가 이어진다.
 * 처음 열기 · 닫기는 대화상자 자신의 움직임(확대 · 축소)으로 바로 바꾼다.
 */
function useDialogSwap(node: ReactNode, key: string): ReactNode {
  const [committed, setCommitted] = useState(key);
  const shownNode = useRef(node);
  const isSwapped = useRef(false);
  // 열기 · 닫기: 바꿔 끼울 앞 것이 없거나 뒤 것이 없다. 이 렌더에서 바로 바꾼다.
  if (committed !== key && (!committed || !key)) {
    setCommitted(key);
    isSwapped.current = false;
  }
  const isPending = committed !== key && !!committed && !!key;
  if (!isPending) shownNode.current = node;
  useLayoutEffect(() => {
    if (!isPending) return;
    swapDialog(() => { isSwapped.current = true; setCommitted(key); });
  }, [isPending, key]);
  return <DialogPanel isSwapped={isSwapped.current}>{isPending ? shownNode.current : node}</DialogPanel>;
}

/** The panel's dialog for its address, and whether it is the loading one. */
function usePanelContent(): { node: ReactNode; isLoading: boolean; href?: string } {
  const result = (node: ReactNode) => ({ node, isLoading: false, href });
  const panel = usePanel();
  const open = useOpenPanel();
  const session = useQuery(sessionOptions()).data;
  const search = useSearchSources();
  const isPhone = useIsMobile();
  const { href, expand } = panel;
  const client = useQueryClient();
  const cached = !!href && isPrepared(client, href);
  const opening = useRef<{ href: string | undefined; cold: boolean }>({ href: undefined, cold: false });
  if (opening.current.href !== href) opening.current = { href, cold: !cached };
  const prepared = useQuery({
    queryKey: ['panel-prepared', session?.id, href, cached],
    enabled: !!href && !isPhone && !cached,
    staleTime: Infinity, gcTime: 0,
    queryFn: async () => {
      await prepare(client, href!, prep => preparePanel(prep, new URL(href!, 'http://cowork.invalid')));
      return true;
    },
  });
  const waiting = !!href && !isPhone && !cached && prepared.isPending;
  const held = useLoadingHold(waiting, { delay: 0, minimum: 300 });
  useEffect(() => { if (isPhone && href) expand(); }, [isPhone, href, expand]);
  // Keep the composing form mounted for this render so its layout effect can hand off the draft before expand.
  if (!href) return result(null);
  if (!isPhone && (waiting || (opening.current.cold && held))) return { node: <PanelLoading href={href} onClose={panel.close} />, isLoading: true, href };
  const url = new URL(href, 'http://cowork.invalid');
  const detail = { surface: 'dialog' as const, onClose: () => panel.close(), onExpand: expand };
  const showSaved = (next: string) => {
    if (url.searchParams.get('returnTo') === next) panel.close();
    else open(next, { surface: 'inherit', replace: true });
  };
  const uuid = '[0-9a-fA-F-]{36}';
  if (url.pathname === '/workspace/projects/new')
    return result(<CreateProjectDialog key={href} onClose={panel.close} onCreated={(key: string) => panel.done(`/workspace/projects/${key}/work-items`)} />);
  const documentPages = new RegExp(`^/workspace/projects/([^/]+)/documents/(${uuid})/pages$`).exec(url.pathname);
  if (documentPages) return result(<DocumentPagesManager key={href} {...detail} projectKey={documentPages[1]} documentId={documentPages[2]} crumbs={[{ label: '문서', href: `/workspace/projects/${documentPages[1]}/documents`, icon: 'document' }]} />);
  const document = new RegExp(`^/workspace/projects/([^/]+)/documents/(${uuid})$`).exec(url.pathname);
  if (document) return result(<DocumentBoxPage key={href} {...detail} projectKey={document[1]} documentId={document[2]} crumbs={[{ label: '문서', href: `/workspace/projects/${document[1]}/documents`, icon: 'document' }]} />);
  const projectItem = /^\/workspace\/projects\/([^/]+)\/work-items\/(\d+)$/.exec(url.pathname);
  if (projectItem) return result(<WorkItemPage key={href} {...detail} projectKey={projectItem[1]} number={Number(projectItem[2])} crumbs={[{ label: '업무', href: `/workspace/projects/${projectItem[1]}/work-items`, icon: 'tasks' }]} />);
  const member = MEMBER.exec(url.pathname)?.[1];
  if (member)
    return result(<ProfileSurface key={href} employeeId={decodeURIComponent(member)} surface="dialog" onClose={panel.close}
      onExpand={id => panel.done(memberHref(id))} />);
  if (url.pathname === '/search')
    return result(<GlobalSearch key={href} surface="dialog" sources={search.sources} shortcuts={search.shortcuts} onGo={panel.done} onClose={panel.close} onExpand={expand} />);
  const projectKey = url.searchParams.get('project') ?? undefined;
  if (url.pathname === '/workspace/work-items/new')
    return result(<NewWorkItem key={href} projectKey={projectKey} columnId={url.searchParams.get('column') ?? undefined} surface="dialog"
      crumbs={[{ label: '새 업무' }]} onClose={panel.close} onExpand={expand}
      onCreated={created => showSaved(workItemHref({ projectKey: created.key, number: created.number }))} />);
  return result(null);
}

/** 대화상자로 여는 화면이 첫 그림에 쓸 것: 그 화면의 라우트 loader와 같은 준비 함수다. */
async function preparePanel(prep: Prep, url: URL) {
  const uuid = '[0-9a-fA-F-]{36}';
  const pages = new RegExp(`^/workspace/projects/([^/]+)/documents/(${uuid})/pages$`).exec(url.pathname);
  if (pages) return (await import('@/pages/_app/workspace/projects/$key/documents')).prepareDocumentPages(prep, pages[1]!);
  const document = new RegExp(`^/workspace/projects/([^/]+)/documents/(${uuid})$`).exec(url.pathname);
  if (document) return (await import('@/pages/_app/workspace/projects/$key/documents')).prepareDocuments(prep, { projectKey: document[1], documentId: url.searchParams.get('chapter') ?? document[2] });
  const item = /^\/workspace\/projects\/([^/]+)\/work-items\/(\d+)$/.exec(url.pathname);
  if (item) return (await import('@/pages/_app/workspace/projects/$key/work-items/$number')).prepareWorkItem(prep, item[1]!, Number(item[2]));
}
