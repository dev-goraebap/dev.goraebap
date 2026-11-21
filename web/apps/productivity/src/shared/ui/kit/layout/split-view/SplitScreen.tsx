import { useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from 'cn';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Page, type CreateAction } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { RowLink } from '@/shared/ui/kit/row-link';
import { kitCrumbs, SplitView, type SplitCrumb, type SplitPlaceholder } from './SplitView';

/** 분할 화면의 주소가 여는 것: 목록만, 항목 하나, 새로 쓰기, 고치기(라우터의 staticData.splitMode). */
export type SplitMode = 'list' | 'view' | 'new' | 'edit';

/** 오른쪽 칸(휴대폰은 그 페이지)에 여는 것. 목록만이면 없다. */
export type SplitPane = { kind: 'view' | 'edit'; id: string } | { kind: 'new' };

/**
 * 목록-상세 분할 화면의 진입부(공지사항 · 회의록). 주소가 정한 것(mode · id)을 칸으로 바꾸고, 휴대폰이면 칸 대신 그 페이지를
 * 연다(phonePage). 목록만이거나 데스크톱이면 목록 화면(children)이 그 칸을 받아 오른쪽에 연다.
 */
export function SplitResource({ mode, id, phonePage, children }: {
  mode: SplitMode;
  id?: string;
  phonePage: (pane: SplitPane) => ReactNode;
  children: (pane: SplitPane | undefined) => ReactNode;
}) {
  const isPhone = useIsMobile();
  const pane: SplitPane | undefined = mode === 'new' ? { kind: 'new' } : id && (mode === 'view' || mode === 'edit') ? { kind: mode, id } : undefined;
  return <>{isPhone && pane ? phonePage(pane) : children(pane)}</>;
}

/**
 * 목록-상세 분할의 목록 화면. 휴대폰은 키트 Page에 목록만(걸린 필터는 칩 줄), 데스크톱은 SplitView에 목록과 오른쪽 칸(걸린
 * 필터는 목록 위 줄). 목록 상태(오류 · 없음)를 주면 줄 대신 그것을 보인다. 오른쪽 칸은 칸(pane)이나 paneKey가 바뀔 때만
 * 새로 만들어, 검색어 · 필터로 목록만 바뀔 때 상세나 쓰던 양식이 다시 그려지지 않는다. 칸을 닫으면 listHref로 간다.
 */
export function SplitScreen({ crumbs, label, create, tools, menu, chips, applied, state, list, listHref, widthKey, placeholder,
  pane, paneKey = '', renderPane, overlay }: {
  crumbs: SplitCrumb[];
  /** 목록의 이름(읽기용). */
  label: string;
  create?: CreateAction;
  /** 검색 · 필터 · 표시. */
  tools?: ReactNode;
  /** 화면 메뉴(…). */
  menu?: ReactNode;
  /** 휴대폰의 걸린 필터 칩 줄. */
  chips?: ReactNode;
  /** 데스크톱의 걸린 필터 줄. */
  applied?: ReactNode;
  /** 줄 대신 보일 상태(불러오지 못함 · 없음 · 조건에 맞는 것 없음). */
  state?: ComponentProps<typeof PageState>;
  /** 줄과 목록 끝(더 보기). 읽는 중이면 null. */
  list: ReactNode;
  listHref: string;
  widthKey: string;
  placeholder: SplitPlaceholder;
  pane?: SplitPane;
  /** 칸을 새로 만들 다른 까닭(주소의 검색 문자열을 읽는 양식). */
  paneKey?: string;
  /** 칸의 내용. close는 목록으로 돌아간다. */
  renderPane: (pane: SplitPane, close: () => void) => ReactNode;
  /** 화면에 함께 띄울 것(대화상자). */
  overlay?: ReactNode;
}) {
  const isPhone = useIsMobile();
  const navigate = useNavigate();
  const close = useRef(() => void navigate({ href: listHref }));
  close.current = () => void navigate({ href: listHref });
  const render = useRef(renderPane);
  render.current = renderPane;
  const paneRef = useRef(pane);
  paneRef.current = pane;
  const key = pane ? `${pane.kind}:${'id' in pane ? pane.id : ''}:${paneKey}` : '';
  // 칸의 내용은 key가 바뀔 때만 만든다(그때의 renderPane으로). 목록 쪽 렌더는 칸을 건드리지 않는다.
  const detail = useMemo(() => (key && paneRef.current && !isPhone ? render.current(paneRef.current, () => close.current()) : undefined), [key, isPhone]);
  if (isPhone) {
    return <Page crumbs={kitCrumbs(crumbs)} create={create} tools={tools} actions={menu} below={chips}>
      {state ? <PageState {...state} /> : list}
      {overlay}
    </Page>;
  }
  return <>
    <SplitView crumbs={crumbs} create={create} tools={tools} pageActions={menu} applied={applied} label={label} list={list} state={state}
      detail={detail} widthKey={widthKey} placeholder={placeholder} onClose={() => close.current()} />
    {overlay}
  </>;
}

/** 분할 목록의 줄 바탕: 자기 바탕을 칠해 빈 칸의 점 무늬를 가리고, 가리키면 옅게, 고른 줄은 진하게. */
const LINK_ROW = 'relative flex items-center gap-3 border-b bg-background px-4 py-3 hover:bg-row-hover compact:py-2 data-chosen:bg-unread-strong';

/**
 * 분할 목록의 한 줄(공지 · 회의록): 줄 어디를 눌러도 그 항목의 주소(href)를 연다(RowLink, 데스크톱은 오른쪽 칸 · 휴대폰은 그
 * 페이지). 앞 표식(start), 제목, 그 아래 설명, 끝 정보(end). 안 읽은 줄은 제목이 굵다.
 */
export function SplitLinkRow({ href, title, isChosen, isUnread, start, description, end }: {
  href: string; title: string; isChosen?: boolean; isUnread?: boolean; start?: ReactNode; description?: ReactNode; end?: ReactNode;
}) {
  return <li data-chosen={isChosen || undefined} className={LINK_ROW}>
    {start ? <span className="relative z-1 flex shrink-0">{start}</span> : null}
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <RowLink to={href} aria-current={isChosen || undefined} title={isUnread ? '읽지 않음' : undefined}
        className={cn('truncate', isUnread && 'font-semibold')}>{title}</RowLink>
      {description}
    </span>
    {end}
  </li>;
}
