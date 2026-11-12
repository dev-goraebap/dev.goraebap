import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { VStack } from '@astryxdesign/core/VStack';
import { useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { useIsPhone, useToolSize } from '../../foundations/media';
import { ActionMenu, type MenuAction } from '../../composites/popup/ActionMenu';
import { AdaptivePopover } from '../../composites/popup/AdaptivePopover';
import { PageAppBarContext, PageBannerContext, PageChromeContext, PageFootContext } from './page-context';
import { PageHeader, type Crumb } from './PageHeader';
import { PageAppliedFilters, PageToolbar } from './PageToolbar';
import styles from './page.module.css';

export type PageCreate = { label: string; onClick?: () => void; options?: MenuAction[] };

export type PageTopProps = {
  crumbs: Crumb[];
  /** 페이지 메뉴(…)·즐겨찾기 등 페이지 자체의 동작. 머리 줄 끝. */
  pageActions?: ReactNode;
  /** 보기·탭. 있으면 툴바가 생기고 도구가 툴바 오른쪽으로 내려간다. */
  views?: ReactNode;
  /** 검색·필터·표시 순서의 도구. */
  tools?: ReactNode;
  /** 실제 필터 조건이 있을 때만 주는 적용 줄. */
  applied?: ReactNode;
  /** 만들기: 데스크톱 머리 줄 마지막, 휴대폰 FAB. 여럿이면 options로 같은 메뉴·시트에서 고른다. */
  create?: PageCreate;
  /** 상세·양식: 휴대폰에서 앱 바·하단 탭 없이 ←와 자기 이름·도구를 가진 전체 화면. 만들기 FAB를 두지 않는다. */
  isDetail?: boolean;
  /** 휴대폰 ←가 갈 곳(위 단계가 없을 때). 없으면 브라우저 기록. */
  onBack?: () => void;
  /** 휴대폰 상세에서 경로 대신 둘 머리 내용. */
  head?: ReactNode;
  /** 본문이 자기 h1을 가지면 false(경로는 그대로 보인다). */
  hasHeading?: boolean;
  /** 본문 바탕의 점 무늬. 기본은 일반 페이지에만, 상세·양식은 평평하다. */
  hasPattern?: boolean;
};

/** 머리·배너 자리·툴바·적용 줄. 보기가 없으면 도구는 머리 줄 오른쪽, 만들기는 그 뒤 넓은 간격. */
function PageTop({ crumbs, pageActions, views, tools, applied, create, isDetail = false, onBack, head, hasHeading, bannerSlot }: PageTopProps & {
  bannerSlot: (element: HTMLElement | null) => void;
}) {
  const isPhone = useIsPhone();
  const appBar = useContext(PageAppBarContext);
  const mobileAppBar = isPhone && !isDetail ? appBar ?? undefined : undefined;
  const hasToolbar = !!views || !!(mobileAppBar && tools);
  const toolSize = useToolSize();
  const createButton = create && !isPhone && !isDetail
    ? create.options?.length
      ? <AdaptivePopover label={create.label} alignment="end" trigger={<Button label={create.label} variant="create" size={toolSize} icon={icon('plus')} />}
        content={close => <ActionMenu onDone={close} actions={create.options ?? []} />} />
      : <Button label={create.label} variant="create" size={toolSize} icon={icon('plus')} onClick={create.onClick} />
    : null;
  const end = hasToolbar ? undefined : tools;
  return <VStack>
    <PageHeader crumbs={crumbs} head={isPhone ? head : undefined} appBar={mobileAppBar} hasHeading={hasHeading}
      onBack={isPhone && isDetail ? onBack ?? (() => window.history.back()) : undefined}
      actions={end || pageActions || createButton
        ? <HStack gap={4} vAlign="center">{end ? <HStack gap={1} vAlign="center">{end}</HStack> : null}{pageActions}{createButton}</HStack>
        : undefined} />
    <VStack ref={bannerSlot} className={styles.banner} />
    {hasToolbar ? <PageToolbar start={views} end={tools} /> : null}
    {applied ? <PageAppliedFilters>{applied}</PageAppliedFilters> : null}
  </VStack>;
}

/**
 * 페이지: 위(PageTop)와 본문. 머리와 툴바는 고정하고 본문만 스크롤한다. 휴대폰 상세는 셸에 전체 화면을 요청하고 바닥
 * 동작 줄(PageActions 자리)을 둔다. 휴대폰 목록의 만들기는 하단 탭 위 FAB이며 본문 끝에 FAB 높이만큼 여유를 둔다.
 */
export function Page({ children, aboveFooter, footer, aside, stableGutter = false, ...top }: PageTopProps & {
  children: ReactNode;
  stableGutter?: boolean;
  /** 본문 옆 패널(미리보기 패널 등). 본문과 따로 스크롤하고 목록을 가리지 않는다. */
  aside?: ReactNode;
  /** 스크롤 본문 아래, 바닥 줄 위에 고정할 것(휴대폰 작성 속성 줄 등). */
  aboveFooter?: ReactNode;
  /** 페이지 바닥에 고정할 동작. 없으면 휴대폰 상세는 PageActions가 채우는 자리를 둔다. */
  footer?: ReactNode;
}) {
  const isPhone = useIsPhone();
  const chrome = useContext(PageChromeContext);
  const isFull = isPhone && !!top.isDetail;
  useLayoutEffect(() => {
    if (!isFull || !chrome) return undefined;
    chrome.setFull(true);
    return () => chrome.setFull(false);
  }, [isFull, chrome]);
  const [banner, setBanner] = useState<HTMLElement | null>(null);
  const [foot, setFoot] = useState<HTMLElement | null>(null);
  // 상세·작성 페이지는 데스크톱에서도 바닥 고정 동작 줄 자리를 둔다(PageActions가 채운다). 동작이 없으면 줄도 없다.
  const footBar = footer ?? (top.isDetail ? <HStack ref={setFoot} className={styles.foot} /> : undefined);
  const hasFab = isPhone && !!top.create && !top.isDetail;
  const content = <LayoutContent padding={0} className={[stableGutter ? styles.stableScroll : '', (top.hasPattern ?? !top.isDetail) ? styles.pattern : ''].filter(Boolean).join(' ')}
    data-fab-space={hasFab || undefined}><PageBannerContext value={banner}>{children}</PageBannerContext></LayoutContent>;
  return <PageFootContext value={footer ? null : foot}>
    <Layout height="fill" header={<PageTop {...top} bannerSlot={setBanner} />}
      content={aboveFooter ? <VStack className={styles.docked} height="100%">{content}{aboveFooter}</VStack> : content}
      footer={footBar} end={aside} />
    {hasFab && top.create ? <Fab create={top.create} /> : null}
  </PageFootContext>;
}

/** 휴대폰 만들기: 하나면 바로, 여럿이면 바텀시트에서 고른다. 하단 탭(3.5rem)과 홈 표시줄 위에 뜬다. */
function Fab({ create }: { create: PageCreate }) {
  const fab = (onClick?: () => void) => <Button className={styles.fab} label={create.label} tooltip={create.label} variant="create" size="lg" isIconOnly
    icon={icon('plus')} onClick={onClick} />;
  if (!create.options?.length) return fab(create.onClick);
  return <AdaptivePopover label={create.label} trigger={fab()} content={close => <ActionMenu title={create.label} onDone={close} actions={create.options ?? []} />} />;
}
