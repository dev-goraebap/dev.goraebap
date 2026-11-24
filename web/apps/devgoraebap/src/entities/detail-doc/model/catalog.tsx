import type { ReactNode } from "react";
import {
  FontLoadingDemo,
  InitialBootDemo,
  PageTransitionDemo,
  RouteMaskingDemo,
  ScrollbarGutterDemo,
  ThinScrollbarDemo,
} from "../ui/DetailDemos";
import { AdaptiveMatrix, AdaptivePatternDemo } from "../ui/AdaptiveDemos";
import { DebounceDemo, LoadingFeedbackDemo, UiStatesDemo } from "../ui/StateDemos";
import { ScaleMethodTable, UiSizeCompareDemo, UnitGuideTable } from "../ui/UiSizeDemos";

interface DetailCodeTab {
  id: string;
  label: string;
  language: string;
  code: string;
}

interface DetailSection {
  id: string;
  title: string;
  problem: string;
  guidance: string;
  codeLabel: string;
  codeLanguage?: string;
  code: string;
  renderDemo?: () => ReactNode;
}

interface DetailReference {
  title: string;
  source: string;
  href: string;
  note: string;
}

export interface DetailDocSpec {
  slug: string;
  title: string;
  summary: string;
  problem?: string;
  guidance?: string;
  codeLabel?: string;
  code?: string;
  codeTabs?: DetailCodeTab[];
  renderDemo?: () => ReactNode;
  sections?: DetailSection[];
  references?: DetailReference[];
}

export const DETAIL_DOCS: DetailDocSpec[] = [
  {
    slug: "scrollbar",
    title: "스크롤바",
    summary: "스크롤바 거터, 얇은 커스텀 스크롤바, 부드러운 스크롤 기준",
    sections: [
      {
        id: "scrollbar-gutter",
        title: "스크롤바 거터",
        problem:
          "세로 스크롤바가 공간을 차지하는 환경에서는 스크롤이 없는 짧은 페이지와 스크롤이 생기는 긴 페이지 사이를 이동할 때마다 뷰포트 폭이 달라져 레이아웃이 좌우로 흔들립니다. scrollbar-gutter: stable은 스크롤이 없는 화면에서도 그 자리를 미리 비워 두어 페이지 전환 시 폭을 일정하게 유지합니다.",
        guidance:
          "페이지 전환이 잦은 루트 스크롤 컨테이너나 목록·패널에 적용합니다. 스크롤이 항상 없는 고정 영역에는 쓰지 않으며, 스크롤바가 내용 위에 겹쳐 뜨는 모바일이나 macOS 기본 설정에서는 변화가 없습니다.",
        codeLabel: "scrollbar-gutter.css",
        codeLanguage: "css",
        code: `html {
  scrollbar-gutter: stable;
}`,
        renderDemo: () => <ScrollbarGutterDemo />,
      },
      {
        id: "thin-scrollbar",
        title: "얇은 커스텀 스크롤바",
        problem:
          "기본 스크롤바는 좁은 사이드바, 패널, 코드 블록에서 내용에 비해 두껍게 보입니다. scrollbar-width: thin으로 폭을 줄이고, scrollbar-color의 첫 값에 막대 색, 둘째 값에 트랙 색을 지정합니다.",
        guidance:
          "색을 디자인 토큰으로 지정하면 라이트, 다크, 테마를 함께 따라갑니다. 스크롤바는 스크롤할 수 있다는 단서이므로 숨기지 않고 배경과 구분되는 색을 씁니다.",
        codeLabel: "thin-scrollbar.css",
        codeLanguage: "css",
        code: `/* Firefox용 표준 속성 (Chromium에서는 ::-webkit-scrollbar가 우선 적용되도록 분리) */
@supports not selector(::-webkit-scrollbar) {
  html,
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 9999px;
}`,
        renderDemo: () => <ThinScrollbarDemo />,
      },
      {
        id: "smooth-scroll",
        title: "부드러운 스크롤",
        problem:
          "마우스 휠의 단계별 스크롤은 긴 문서나 브랜드 페이지를 읽을 때 딱딱하게 끊겨 보일 수 있습니다. CSS의 scroll-behavior: smooth는 앵커 이동에만 적용되므로, 휠 스크롤까지 관성으로 부드럽게 다루려면 lenis 같은 전용 라이브러리가 필요합니다.",
        guidance:
          "모든 업무 앱에 필수로 넣지는 않고, 문서·블로그·랜딩처럼 읽기 감촉이 중요한 사이트에서 필요할 때 선택해 적용합니다. prefers-reduced-motion: reduce 환경에서는 비활성화하고, 독립 스크롤이 필요한 사이드바나 모달에는 data-lenis-prevent를 붙여 스크롤 충돌을 막습니다.",
        codeLabel: "smooth-scroll.ts",
        codeLanguage: "ts",
        code: `import Lenis from "lenis";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReducedMotion) {
  const lenis = new Lenis({ autoRaf: true });
  // 언마운트 시 lenis.destroy() 호출
}

// 독립 스크롤 컨테이너(사이드바·모달 등)에는 data-lenis-prevent 속성 추가`,
      },
    ],
  },
  {
    slug: "page-transition",
    title: "페이지 전환과 대기",
    summary: "이전 화면 유지, 임계 시간 초과 시 지연 프로그레스바, View Transitions API 전환 기준",
    problem:
      "링크를 누르자마자 빈 화면이나 스켈레톤으로 넘기면 빠른 응답에서도 화면이 깜빡입니다. 캐시가 있으면 즉시 전환하고, 지연이 길어질 때만 상단에 얇은 프로그레스바를 띄운 뒤 완성된 화면을 View Transition으로 교체하면 끊김 없는 전환을 만들 수 있습니다.",
    guidance:
      "동작 원칙과 CSS는 프레임워크에 관계없이 동일하며, 라우터의 데이터 선조회(loader / resolver)와 캐시 계층을 연결해 구현합니다. 임계 시간은 보통 150~200ms로 두고, View Transitions API를 지원하지 않는 브라우저에서는 즉시 교체로 자연스럽게 폴백합니다.",
    codeLabel: "view-transition.css",
    code: `::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 160ms;
  animation-timing-function: ease-out;
}`,
    codeTabs: [
      {
        id: "css",
        label: "CSS",
        language: "css",
        code: `/* View Transitions API 공통 전환 시간 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 160ms;
  animation-timing-function: ease-out;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0ms;
  }
}`,
      },
      {
        id: "react",
        label: "React (TanStack Router)",
        language: "tsx",
        code: `import { createRouter, useRouterState } from "@tanstack/react-router";

// 1. 라우터에 View Transition과 대기 임계시간 설정
export const router = createRouter({
  routeTree,
  defaultViewTransition: true,
  defaultPendingMs: 180, // 180ms 이내 응답은 로딩 표시 없이 바로 전환
});

// 2. 라우트 loader에서 캐시 우선 선조회 (캐시 적중 시 0ms 통과)
export const Route = createFileRoute("/projects/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(projectQueryOptions(params.id)),
});

// 3. 임계시간 초과 시 상단 프로그레스바 표시
export function TopProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  return isLoading ? <div className="bg-primary fixed inset-x-0 top-0 z-50 h-0.5" /> : null;
}`,
      },
      {
        id: "angular",
        label: "Angular (Router)",
        language: "ts",
        code: `import { provideRouter, withViewTransitions } from "@angular/router";

// 1. 라우터에 View Transitions API 활성화
export const appConfig = {
  providers: [provideRouter(routes, withViewTransitions())],
};

// 2. ResolveFn에서 캐시 확인 후 데이터 선조회 (완료 전까지 이전 화면 유지)
export const projectResolver: ResolveFn<Project> = (route) => {
  const store = inject(ProjectCacheService);
  return store.getOrFetch(route.paramMap.get("id")!);
};

// 3. NavigationStart ~ NavigationEnd 사이 180ms 타이머로 상단 프로그레스바 토글`,
      },
    ],
    renderDemo: () => <PageTransitionDemo />,
  },
  {
    slug: "initial-load",
    title: "초기 진입과 새로고침",
    summary: "처음 진입과 새로고침 시 폰트 흔들림과 화면 깜빡임을 막는 마감 기준",
    sections: [
      {
        id: "font-loading",
        title: "폰트 로딩과 흔들림 방지",
        problem:
          "font-display: swap만 쓰면 새로고침 직후 시스템 폰트로 먼저 그려졌다가 웹폰트가 도착하면서 글자 폭과 줄바꿈이 흔들립니다. 반대로 폰트가 끝날 때까지 무조건 기다리면 느린 네트워크에서 빈 화면이 길어집니다. document.fonts.ready와 짧은 타임아웃(180ms)을 함께 두면 캐시·빠른 환경에서는 흔들림 없이 한 번에 표시하고, 느린 환경에서도 빈 화면에 갇히지 않습니다.",
        guidance:
          "CDN 호스트에 rel='preconnect'를 먼저 선언하고, 한국어 웹폰트는 다이나믹 서브셋을 써서 첫 로드 용량을 줄입니다. 스크립트가 실패하더라도 화면이 가려지지 않도록 짧은 타임아웃 폴백을 반드시 함께 둡니다.",
        codeLabel: "index.html",
        codeLanguage: "html",
        code: `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<style>
  html.fonts-loading { opacity: 0; }
  html { transition: opacity 120ms ease-out; }
</style>
<script>
  (() => {
    const root = document.documentElement;
    root.classList.add("fonts-loading");
    const reveal = () => root.classList.remove("fonts-loading");
    const timer = setTimeout(reveal, 180);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        clearTimeout(timer);
        reveal();
      });
    } else {
      reveal();
    }
  })();
</script>`,
        renderDemo: () => <FontLoadingDemo />,
      },
      {
        id: "initial-boot-screen",
        title: "초기 로딩 스크린",
        problem:
          "로그인 세션, 권한, 워크스페이스 목록처럼 화면 골격을 결정하는 초기 데이터가 도착하기 전에 앱을 그대로 그리면, 빈 메뉴 → 권한별 리다이렉트 → 본문 스켈레톤이 연달아 깜빡이며 완성도가 떨어져 보입니다. 초기 부트 단계에서 가벼운 로딩 스크린을 유지했다가 필수 데이터와 폰트가 준비된 뒤 완성된 첫 화면을 한 번에 드러냅니다.",
        guidance:
          "초기 로딩 스크린은 첫 진입과 새로고침 시 1회만 쓰고, 이후 페이지 간 이동에서는 '페이지 전환과 대기' 패턴(기존 화면 유지 + 지연 프로그레스바)으로 이어 갑니다. 인증 실패나 네트워크 오류 시에는 로딩에 갇히지 않고 오류 화면이나 로그인으로 즉시 전환합니다.",
        codeLabel: "AppBootGate.tsx",
        codeLanguage: "tsx",
        code: `export function AppBootGate({ children }: { children: ReactNode }) {
  const { isPending, isError } = useInitialSessionQuery();

  if (isPending) {
    return <BootSplashScreen />; // 세션·권한·초기 데이터 준비 전까지 유지
  }
  if (isError) {
    return <BootErrorFallback />;
  }
  return <>{children}</>;
}`,
        renderDemo: () => <InitialBootDemo />,
      },
    ],
  },
  {
    slug: "adaptive-ui",
    title: "적응형 UI",
    summary:
      "64rem 미만 터치 환경에서 오버레이·목록·입력 방식을 모바일 조작에 맞게 전환하는 기준과 예외",
    sections: [
      {
        id: "adaptive-criteria",
        title: "전환 기준과 대상 구분",
        problem:
          "화면이 좁아졌다고 모든 오버레이를 바텀시트로 바꾸면 짧은 안내가 과하게 커지거나, 파괴적 확인창이 실수로 닫힐 위험이 생깁니다. 입력·선택이 필요한 오버레이는 바텀시트로 옮기고, 주의를 강제해야 하는 확인창은 중앙에 유지해 조작 의도를 지킵니다.",
        guidance:
          "전환 경계는 64rem 미만이며 @goraebap/ui-react/lib/use-is-mobile의 useIsMobile이 이 기준으로 화면을 판별합니다. Dialog와 Popover는 자동 전환 래퍼를 쓰고, Select·Menu·Combobox·Context Menu는 useIsMobile로 분기해 BottomSheet를 직접 조합합니다.",
        codeLabel: "use-is-mobile.ts",
        codeLanguage: "tsx",
        code: `import { useIsMobile } from "@goraebap/ui-react/lib/use-is-mobile";

const isMobile = useIsMobile();`,
        renderDemo: () => <AdaptiveMatrix />,
      },
      {
        id: "dialog-to-sheet",
        title: "Dialog를 바텀시트로 전환",
        problem:
          "데스크톱 중앙 모달을 모바일에 그대로 띄우면 상단 닫기 버튼에 엄지가 닿기 어렵고 좌우 여백 때문에 입력 영역이 좁아집니다. 필터 설정이나 선택지는 화면 아래에서 올라오는 시트로 열어야 한 손으로 조작하고 끌어내려 닫을 수 있습니다.",
        guidance:
          "@goraebap/ui-react/components/responsive-overlay의 ResponsiveDialog가 64rem 경계에 따라 Dialog와 BottomSheet를 자동으로 전환합니다. BottomSheet는 아래로 끌어내려 닫기, Esc, 바깥 클릭과 포커스 트랩·복원을 기본으로 처리합니다.",
        codeLabel: "ResponsiveDialog.tsx",
        codeLanguage: "tsx",
        code: `<ResponsiveDialog>
  <ResponsiveDialogTrigger render={<Button />}>필터 설정</ResponsiveDialogTrigger>
  <ResponsiveDialogContent>
    <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
    <ResponsiveDialogDescription>조건을 고릅니다.</ResponsiveDialogDescription>
  </ResponsiveDialogContent>
</ResponsiveDialog>`,
        renderDemo: () => <AdaptivePatternDemo pattern="dialog" />,
      },
      {
        id: "popover-to-sheet",
        title: "Popover를 바텀시트로 전환",
        problem:
          "트리거 옆에 뜨는 팝오버는 좁은 화면에서 좌우 가장자리에 잘리거나, 옵션이 여러 줄일 때 손가락에 가려 선택하기 어렵습니다. 반대로 한두 줄짜리 짧은 도움말까지 시트로 열면 화면 흐름이 끊깁니다.",
        guidance:
          '@goraebap/ui-react/components/responsive-overlay의 ResponsivePopover는 64rem 미만에서 자동으로 BottomSheet로 바뀝니다. 짧은 안내처럼 팝오버 형태가 나은 경우에만 mobile="popover"를 지정해 모바일에서도 팝오버를 유지합니다.',
        codeLabel: "ResponsivePopover.tsx",
        codeLanguage: "tsx",
        code: `<ResponsivePopover>
  <ResponsivePopoverTrigger render={<Button variant="outline" />}>표시 옵션</ResponsivePopoverTrigger>
  <ResponsivePopoverContent>
    <ResponsivePopoverTitle>표시 옵션</ResponsivePopoverTitle>
  </ResponsivePopoverContent>
</ResponsivePopover>

{/* 모바일에서도 팝오버 유지 */}
<ResponsivePopover mobile="popover">...</ResponsivePopover>`,
        renderDemo: () => <AdaptivePatternDemo pattern="popover" />,
      },
      {
        id: "list-to-sheet",
        title: "Select·Menu·Combobox를 바텀시트 목록으로",
        problem:
          "데스크톱 드롭다운은 항목 높이가 좁아 터치 오입력이 잦고, 검색 입력이 있는 Combobox는 가상 키보드가 올라오면 결과 목록이 가려집니다. 우클릭으로 여는 Context Menu는 터치 기기에서 접근 경로 자체가 사라집니다.",
        guidance:
          "Select, Menu, Combobox, Context Menu에는 자동 전환 래퍼가 없으므로 useIsMobile로 분기해 BottomSheet를 직접 씁니다. 시트 안의 항목은 최소 44px(h-11) 높이로 배치하고, Context Menu 동작은 항목 옆 더보기 버튼으로 함께 노출합니다.",
        codeLabel: "ItemActions.tsx",
        codeLanguage: "tsx",
        code: `const isMobile = useIsMobile();

if (isMobile) {
  return (
    <BottomSheet>
      <BottomSheetTrigger render={<Button variant="outline" />}>더보기</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>항목 작업</BottomSheetTitle>
        <BottomSheetClose render={<Button variant="ghost" className="h-11 w-full justify-start" />}>
          복제
        </BottomSheetClose>
      </BottomSheetContent>
    </BottomSheet>
  );
}

return (
  <Menu>
    <MenuTrigger render={<Button variant="outline" />}>더보기</MenuTrigger>
    <MenuContent>
      <MenuItem>복제</MenuItem>
    </MenuContent>
  </Menu>
);`,
        renderDemo: () => <AdaptivePatternDemo pattern="menu" />,
      },
      {
        id: "keep-centered",
        title: "확인창은 모바일에서도 중앙에 유지",
        problem:
          "삭제·탈퇴·초기화처럼 되돌릴 수 없는 확인을 바텀시트로 내리면, 아래로 끌어내리거나 바깥을 스치는 동작으로 의도와 다르게 닫히기 쉽습니다. 위험한 결정일수록 시선의 중심을 잡아 명확하게 선택하도록 해야 합니다.",
        guidance:
          "AlertDialog는 바텀시트로 전환하지 않고 모바일에서도 중앙 모달을 그대로 유지합니다. 취소와 파괴적 실행 버튼은 좁은 화면에서 충분한 간격을 두고 명확한 동사로 구분합니다.",
        codeLabel: "ConfirmDelete.tsx",
        codeLanguage: "tsx",
        code: `<AlertDialog>
  <AlertDialogTrigger render={<Button variant="destructive" />}>삭제</AlertDialogTrigger>
  {/* 모바일에서도 중앙 모달 유지 */}
</AlertDialog>`,
      },
      {
        id: "touch-and-hover",
        title: "호버 대체와 터치 영역 확보",
        problem:
          "터치 기기에는 마우스 호버와 우클릭이 없습니다. Tooltip이나 Preview Card 안에 필수 안내나 실행 동작을 숨기면 모바일 사용자는 확인할 방법이 없고, 작은 아이콘 버튼이 밀집되면 옆 항목을 잘못 누르게 됩니다.",
        guidance:
          "호버 전용 컴포넌트에는 보조 설명만 두고 필수 정보는 화면에 직접 드러냅니다. 모바일 주요 실행 버튼은 전체 폭(w-full)이나 size='lg'로 터치 영역을 키우고, 인접한 보조 버튼 사이에는 충분한 간격을 둡니다.",
        codeLabel: "MobileAction.tsx",
        codeLanguage: "tsx",
        code: `<Button size={isMobile ? "lg" : "default"} className={isMobile ? "w-full" : undefined}>
  저장
</Button>`,
      },
      {
        id: "keyboard-and-safe-area",
        title: "가상 키보드와 Safe Area 대응",
        problem:
          "모바일 브라우저에서 100vh는 주소창과 가상 키보드 높이를 반영하지 못해 하단 버튼이 화면 밖으로 밀리거나 키보드 뒤에 가립니다. 또한 노치와 홈 인디케이터 영역에 하단 실행 바가 겹치면 마지막 버튼을 탭하기 어렵습니다.",
        guidance:
          "오버레이와 고정 패널의 높이는 동적 뷰포트 단위(dvh)로 제한하고, 하단 여백에는 env(safe-area-inset-bottom)을 더합니다. BottomSheet는 최대 높이 85dvh, 내부 스크롤, 하단 safe area 여백을 기본으로 적용하므로 화면 하단 고정 바나 커스텀 패널에만 추가로 지정합니다.",
        codeLabel: "SafeAreaBar.tsx",
        codeLanguage: "tsx",
        code: `{/* BottomSheet는 최대 높이 85dvh · 내부 스크롤 · 하단 safe area 기본 적용 */}
<BottomSheetContent>
  <BottomSheetTitle>옵션 선택</BottomSheetTitle>
  {/* 긴 목록도 시트 내부에서 스크롤됨 */}
</BottomSheetContent>

{/* 커스텀 하단 고정 바에는 dvh와 safe-area-inset-bottom을 직접 적용 */}
<div className="bg-background fixed inset-x-0 bottom-0 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
  <Button size="lg" className="w-full">저장</Button>
</div>`,
      },
      {
        id: "state-on-switch",
        title: "화면 폭 전환 시 입력 상태 유지",
        problem:
          "ResponsiveDialog와 ResponsivePopover는 64rem 경계를 넘을 때 Dialog·Popover와 BottomSheet 트리를 교체해 렌더링합니다. 열림 상태(open)는 래퍼가 이어 주지만, 내부에 비제어로 둔 입력값이나 선택 초안은 언마운트되면서 초기화됩니다.",
        guidance:
          "창 크기를 조절하거나 기기 방향을 돌려도 작성 중인 값이 사라지지 않도록, 입력값과 필터 상태는 ResponsiveDialog·ResponsivePopover 바깥의 state에 두고 제어 props로 전달합니다.",
        codeLabel: "ControlledResponsiveDialog.tsx",
        codeLanguage: "tsx",
        code: `const [open, setOpen] = useState(false);
const [keyword, setKeyword] = useState("");

return (
  <ResponsiveDialog open={open} onOpenChange={setOpen}>
    <ResponsiveDialogTrigger render={<Button />}>필터 설정</ResponsiveDialogTrigger>
    <ResponsiveDialogContent>
      <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
      <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
    </ResponsiveDialogContent>
  </ResponsiveDialog>
);`,
      },
      {
        id: "dedicated-edit",
        title: "전역 검색과 폼은 전용 페이지로",
        problem:
          "모바일에서 가상 키보드가 올라오면 화면의 절반 이상이 가려집니다. 입력이 필요한 폼이나 전역 검색을 바텀시트에 넣으면 스크롤과 스와이프 닫기가 충돌하고, 주소가 없어 새로고침할 때 작업 맥락을 잃습니다.",
        guidance:
          "필터와 선택지만 ResponsiveDialog로 처리합니다. 전역 검색과 폼은 길이와 관계없이 자기 주소를 가진 페이지가 원본이며, 데스크톱에서는 지금 화면 위 모달로 열고 주소만 대상 페이지로 바꿉니다. 모바일에서는 바텀시트 없이 처음부터 페이지로 이동합니다.",
        codeLabel: "edit-route.tsx",
        codeLanguage: "tsx",
        code: `// 필터·선택지 → ResponsiveDialog
// 폼·전역 검색 → 전용 라우트 (/items/$id/edit, /search)
// 데스크톱은 라우팅 마스크로 모달, 모바일은 페이지`,
      },
    ],
  },
  {
    slug: "ui-size",
    title: "화면 크기와 rem",
    summary: "브라우저 확대와 별개로 화면 크기를 고를 수 있게 하는 rem·px 분리 기준과 구현 방식",
    sections: [
      {
        id: "why-setting",
        title: "브라우저 확대가 있는데 왜 필요한가",
        problem:
          "브라우저 확대는 어느 사이트에서나 쓰는 기본 수단이며 사이트 설정이 이를 대신하지는 않습니다. 다만 브라우저를 확대하면 CSS 뷰포트가 좁아져 데스크톱에서도 모바일 배치로 넘어갈 수 있습니다. 넓은 화면 배치는 그대로 두고 글자와 컨트롤만 키우고 싶을 때 사이트의 화면 크기 설정이 도움이 됩니다.",
        guidance:
          "이 설정은 브라우저 기능 위에 더하는 선택지입니다. 뷰포트 메타에서 확대를 막지 않으며, WCAG 200% 글자 확대와 320 CSS 픽셀 폭 리플로우 기준도 그대로 지킵니다. 이 사이트 설정은 125%까지만 다루므로 브라우저 확대를 대체하지 않습니다.",
        codeLabel: "viewport.html",
        codeLanguage: "html",
        code: `<!-- 확대를 막는 maximum-scale, user-scalable=no는 쓰지 않습니다. -->
<meta name="viewport" content="width=device-width, initial-scale=1" />`,
        renderDemo: () => <ScaleMethodTable />,
      },
      {
        id: "where-rem",
        title: "rem을 쓰는 곳과 px을 남기는 곳",
        problem:
          "모든 수치를 기계적으로 rem으로 바꿀 필요는 없습니다. 글자와 버튼처럼 읽고 누르는 요소는 설정을 따라 커져야 하지만, 1px 테두리나 그림자까지 함께 두꺼워지면 화면만 둔탁해집니다.",
        guidance:
          "기준은 하나입니다. 이 값이 커졌을 때 읽거나 누르기 쉬워지는지 따져 보고, 그렇다면 rem을 쓰고 아니라면 px을 남깁니다.",
        codeLabel: "units.css",
        codeLanguage: "css",
        code: `.field {
  height: 2.25rem;
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--input);
}`,
        renderDemo: () => <UnitGuideTable />,
      },
      {
        id: "size-setting",
        title: "사용자가 고르는 화면 크기",
        problem:
          "루트 글자 크기를 px로 고정하면 브라우저의 글꼴 크기 설정이 무시됩니다. 퍼센트로 지정하면 브라우저 설정 위에 사용자의 선택이 곱해지고, rem으로 설계한 크기와 간격이 한꺼번에 따라옵니다.",
        guidance:
          "사용자가 고른 작게·기본·크게·더 크게 단계는 첫 화면을 그리기 전에 적용해 초기 크기가 튀지 않게 합니다. iOS는 16px 미만 입력창에 포커스하면 화면을 자동 확대하므로, 터치 입력이 가능한 환경에서는 입력창 글자만 16px 아래로 내려가지 않게 합니다.",
        codeLabel: "ui-size.css",
        codeLanguage: "css",
        code: `html {
  font-size: var(--ui-size, 100%);
}

@media (any-pointer: coarse) {
  input:not([type="checkbox"], [type="radio"], [type="range"]),
  textarea {
    font-size: max(1rem, 16px);
  }
}`,
        renderDemo: () => <UiSizeCompareDemo />,
      },
      {
        id: "query-units",
        title: "미디어 쿼리와 컨테이너 쿼리의 차이",
        problem:
          "미디어 쿼리의 rem은 문서에 지정한 값이 아니라 브라우저 초기값을 기준으로 계산하므로 사이트 설정을 바꿔도 전환 지점이 움직이지 않습니다. 반면 컨테이너 쿼리의 rem은 계산된 값을 따르므로 글자를 키우면 전환 지점도 함께 커집니다.",
        guidance:
          "사이드바 같은 전체 페이지 배치는 미디어 쿼리로 안정적으로 유지하고, 글자가 커졌을 때 먼저 세로로 접혀야 하는 카드나 좁은 패널은 컨테이너 쿼리로 전환합니다.",
        codeLabel: "queries.css",
        codeLanguage: "css",
        code: `/* 화면 크기 설정과 무관하게 1024px 기준 */
@media (width >= 64rem) {
  .shell { grid-template-columns: 16rem 1fr; }
}

/* 18px 기준이면 432px, 20px 기준이면 480px에서 전환 */
@container (width >= 24rem) {
  .card { flex-direction: row; }
}`,
      },
    ],
    references: [
      {
        title: "Understanding SC 1.4.4: Resize Text",
        source: "W3C WCAG 2.2",
        href: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html",
        note: "글자를 200%까지 키워도 내용과 기능을 잃지 않아야 하는 기준입니다.",
      },
      {
        title: "Understanding SC 1.4.10: Reflow",
        source: "W3C WCAG 2.2",
        href: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
        note: "320 CSS 픽셀 폭에서도 가로·세로 동시 스크롤 없이 읽혀야 하는 기준입니다.",
      },
      {
        title: "G178: 글자 크기를 조절하는 페이지 내 컨트롤",
        source: "W3C WCAG 2.2 Techniques",
        href: "https://www.w3.org/WAI/WCAG22/Techniques/general/G178",
        note: "페이지 안에 글자 크기 조절을 두는 기법입니다. 200%까지 지원해야 충족하므로, 125%까지인 이 설정은 브라우저 확대를 대신하지 않습니다.",
      },
      {
        title: "Media Queries Level 4",
        source: "W3C",
        href: "https://www.w3.org/TR/mediaqueries-4/",
        note: "미디어 쿼리의 rem 같은 상대 단위가 초기값을 기준으로 계산된다고 정의합니다.",
      },
      {
        title: "CSS Conditional Rules Level 5",
        source: "W3C",
        href: "https://www.w3.org/TR/css-conditional-5/",
        note: "컨테이너 쿼리의 상대 단위가 계산된 값을 기준으로 동작한다고 정의합니다.",
      },
      {
        title: "font-size",
        source: "MDN",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/font-size",
        note: "접근성을 위해 사용자의 브라우저 기본 글꼴 크기에 상대적인 단위를 권장합니다.",
      },
      {
        title: "Typography",
        source: "web.dev",
        href: "https://web.dev/learn/design/typography",
        note: "글자 크기를 뷰포트 단위만으로 정하면 사용자가 확대할 수 없는 문제를 설명합니다.",
      },
    ],
  },
  {
    slug: "ui-states",
    title: "화면 상태",
    summary:
      "데이터 부재, 검색 결과 없음, 404, 요청 실패 상황에 대응하는 Empty State와 Error State 기준",
    sections: [
      {
        id: "state-kinds",
        title: "상태를 나누는 기준",
        problem:
          "빈 목록, 검색 결과 없음, 404, 서버 오류를 한 가지 안내 문구로 묶어 두면 사용자는 기다려야 하는지, 조건을 바꿔야 하는지, 다시 시도해야 하는지 판단하기 어렵습니다. 원인과 다음 행동이 다르므로 네 가지 상태를 분명히 구분합니다.",
        guidance:
          "Empty는 첫 항목을 만드는 행동으로, No Results는 검색이나 필터 조건을 바꾸는 행동으로, 404는 돌아갈 곳으로, Error는 다시 시도로 이어지게 구성합니다.",
        codeLabel: "PageState.tsx",
        codeLanguage: "tsx",
        code: `<PageState
  kind="search"
  title="검색 결과가 없습니다"
  description="다른 단어로 찾아보세요."
  action={<Button variant="outline" size="sm">검색어 지우기</Button>}
/>`,
        renderDemo: () => <UiStatesDemo />,
      },
      {
        id: "state-motion",
        title: "이미지와 글의 등장",
        problem:
          "상태 화면이 아무 예고 없이 툭 나타나면 화면이 끊긴 것처럼 느껴지고, 일러스트 이미지가 늦게 도착하면 아래 글이 밀리며 레이아웃이 흔들립니다.",
        guidance:
          "상태 이미지는 자리를 먼저 잡아 두고 도착하면 자연스럽게 드러내며, 글은 짧게 떠오르게 합니다. 움직임 줄이기 설정이 켜져 있으면 애니메이션 없이 바로 표시합니다.",
        codeLabel: "page-state.css",
        codeLanguage: "css",
        code: `@keyframes page-state-enter {
  from {
    opacity: 0;
    transform: translateY(0.375rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.page-state {
  animation: page-state-enter 420ms cubic-bezier(0.2, 0, 0, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .page-state {
    animation: none;
  }
}`,
      },
    ],
  },
  {
    slug: "loading-feedback",
    title: "로딩과 크기 전환",
    summary: "모달과 패널의 입력 디바운스, 지연 로딩 표시, 결과 양에 따른 높이 전환 기준",
    sections: [
      {
        id: "debounce",
        title: "입력 디바운스와 요청 취소",
        problem:
          "한 글자를 입력할 때마다 결과가 바뀌면 화면이 계속 흔들리고, API를 호출하는 화면에서는 쓰지 않을 요청이 쌓입니다. 늦게 보낸 요청의 응답이 먼저 도착하면 지금 입력한 검색어와 다른 결과가 화면에 남을 수 있습니다.",
        guidance:
          "입력이 멈추고 200~300ms 뒤에 검색을 실행합니다. 입력을 지우면 기다리지 않고 바로 되돌리고, Enter를 누르면 대기 없이 지금 검색어로 즉시 실행합니다. API를 호출할 때는 새 요청을 보내기 전에 이전 요청을 취소합니다. 디바운스는 요청 수를 줄일 뿐 응답 순서를 보장하지 않으므로 취소를 함께 써야 합니다.",
        codeLabel: "use-search.ts",
        codeLanguage: "ts",
        code: `const debouncedQuery = useDebouncedValue(query, 250);

useEffect(() => {
  if (!debouncedQuery.trim()) return;

  const controller = new AbortController();
  fetch(\`/api/search?q=\${encodeURIComponent(debouncedQuery)}\`, {
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then(setResults)
    .catch((error) => {
      if (error.name !== "AbortError") setError(error);
    });

  return () => controller.abort();
}, [debouncedQuery]);`,
        renderDemo: () => <DebounceDemo />,
      },
      {
        id: "delayed-spinner",
        title: "기본 높이와 지연 스피너",
        problem:
          "모달이 빈 상태로 작게 열렸다가 데이터가 도착하면서 갑자기 커지면 화면이 크게 튑니다. 반대로 금방 끝나는 응답에도 스피너를 즉시 띄우면 불필요한 깜빡임만 늘어납니다.",
        guidance:
          "모달은 기본 높이를 먼저 잡아 두고, 응답이 180ms를 넘길 때만 스피너를 보여 줍니다. 모달을 열고 닫을 때는 페이지 전환 효과를 쓰지 않습니다.",
        codeLabel: "SearchDialog.tsx",
        codeLanguage: "tsx",
        code: `<DialogContent>
  <Suspense fallback={<SearchLoading />}>
    <SearchPanel className="min-h-[24rem]" />
  </Suspense>
</DialogContent>`,
        renderDemo: () => <LoadingFeedbackDemo />,
      },
      {
        id: "height-transition",
        title: "내용 변화에 따른 높이 전환",
        problem:
          "height: auto에는 CSS 전환이 걸리지 않아, 검색 결과 개수가 바뀔 때마다 모달 높이가 중간 과정 없이 한 번에 바뀝니다.",
        guidance:
          "ResizeObserver로 바뀐 높이를 재고 앞 높이부터 200ms 동안 부드럽게 움직입니다. 움직임 줄이기 설정이 켜져 있으면 전환 없이 바로 바꿉니다.",
        codeLabel: "use-height-transition.ts",
        codeLanguage: "ts",
        code: `const observer = new ResizeObserver(() => {
  if (motion) return;
  const next = element.offsetHeight;
  if (Math.abs(next - last) <= 1 || reduced.matches) {
    last = next;
    return;
  }
  motion = element.animate(
    [
      { height: \`\${last}px\`, overflow: "hidden" },
      { height: \`\${next}px\`, overflow: "hidden" },
    ],
    { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  );
  motion.onfinish = () => {
    motion = undefined;
    last = element.offsetHeight;
  };
});`,
      },
    ],
  },
  {
    slug: "route-masking",
    title: "라우팅 마스크",
    summary:
      "데스크톱은 목록 위 모달과 상세 URL, 새로고침·공유·모바일은 독립 상세 페이지로 전환하는 패턴",
    problem:
      "목록에서 항목을 볼 때 데스크톱에서는 목록 컨텍스트를 유지한 채 빠르게 훑고 싶지만, 모달만 띄우면 URL 공유와 새로고침이 깨집니다. 라우팅 마스크를 쓰면 데스크톱은 목록 위 모달 + 상세 URL을 유지하고, 모바일이나 직접 URL 진입 시에는 자연스럽게 전체 상세 페이지로 열 수 있습니다.",
    guidance:
      "모바일에서는 모달 마스킹을 끄고 일반 페이지 이동으로 분기하면 브라우저 뒤로가기만으로 목록에 복귀하는 익숙한 경험을 제공합니다.",
    codeLabel: "route-masking.tsx",
    codeTabs: [
      {
        id: "react",
        label: "React (TanStack Router)",
        language: "tsx",
        code: `// 데스크톱: 목록(/posts) 위 모달을 열면서 주소창만 /posts/$id로 마스킹
<Link
  to="/posts"
  search={{ preview: post.id }}
  mask={isMobile ? undefined : { to: "/posts/$id", params: { id: post.id } }}
>
  {post.title}
</Link>

// 모바일 또는 새로고침(/posts/$id 직접 진입): 독립 상세 페이지 렌더링`,
      },
      {
        id: "angular",
        label: "Angular (Router)",
        language: "ts",
        code: `// 데스크톱: 목록 컨텍스트 유지 + 모달/보조 라우트로 열고 location.go('/posts/' + id)
// 모바일 또는 직접 진입: 일반 /posts/:id 라우트 컴포넌트로 전체 화면 렌더링
openPost(id: string) {
  if (this.isMobile()) {
    this.router.navigate(["/posts", id]);
  } else {
    this.openPreviewModal(id);
  }
}`,
      },
    ],
    renderDemo: () => <RouteMaskingDemo />,
    sections: [
      {
        id: "search-and-forms",
        title: "전역 검색과 폼에 적용하기",
        problem:
          "전역 검색이나 폼을 모달이나 바텀시트로만 만들면 고유 주소가 없어 새로고침하거나 링크를 공유할 때 작업 맥락이 끊깁니다. 길이와 관계없이 자기 주소를 가진 페이지를 원본으로 두고, 환경에 따라 열기 방식만 나눕니다.",
        guidance:
          "데스크톱에서는 지금 화면 위 모달로 열고 주소만 대상 페이지로 바꾸며, 새로고침하거나 페이지로 보기를 누르면 전체 페이지로 전환합니다. 모바일에서는 바텀시트 없이 처음부터 대상 페이지로 이동합니다.",
        codeLabel: "open-search.tsx",
        codeLanguage: "tsx",
        code: `function openSearch() {
  if (isMobile) return navigate({ to: "/search" });

  navigate({
    to: location.pathname,
    search: { ...location.search, panel: "search" },
    mask: { to: "/search", unmaskOnReload: true },
    resetScroll: false,
  });
}`,
      },
    ],
  },
];

export function getDetailDoc(slug: string) {
  return DETAIL_DOCS.find((item) => item.slug === slug);
}
