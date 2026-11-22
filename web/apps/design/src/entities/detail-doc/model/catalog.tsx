import type { ReactNode } from "react";
import {
  AdaptiveDialogDemo,
  FontLoadingDemo,
  InitialBootDemo,
  PageTransitionDemo,
  RouteMaskingDemo,
  ScrollbarGutterDemo,
  ThinScrollbarDemo,
} from "../ui/DetailDemos";

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
}

export const DETAIL_DOCS: DetailDocSpec[] = [
  {
    slug: "scrollbar",
    title: "스크롤바",
    summary: "스크롤바 거터, 얇은 커스텀 스크롤바, 부드러운 스크롤 기준을 다룹니다.",
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
    summary:
      "새 화면 데이터가 준비될 때까지 이전 화면을 유지하고, 임계 시간을 넘길 때만 상단 프로그레스바를 띄운 뒤 View Transitions API로 부드럽게 전환합니다.",
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
    summary:
      "웹사이트에 처음 진입하거나 새로고침할 때 폰트 흔들림과 불완전한 화면 깜빡임을 막는 마감 기준을 다룹니다.",
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
      "화면 폭만 줄이는 반응형을 넘어, 모바일에서 사용자가 기대하는 조작 방식으로 표현을 바꾸는 기준을 다룹니다.",
    sections: [
      {
        id: "dialog-to-sheet",
        title: "대화상자에서 바텀시트로 (확인창은 중앙 유지)",
        problem:
          "데스크톱의 중앙 모달을 모바일에 그대로 띄우면 한 손으로 닫기 어렵고 입력 영역이 좁아집니다. 필터나 짧은 입력 대화상자는 모바일에서 하단 바텀시트로 전환하고, 삭제·초기화 같은 확인창(Alert Dialog)은 실수 방지를 위해 중앙 모달을 유지합니다.",
        guidance:
          "DialogContent의 surface 속성을 뷰포트에 따라 'dialog'와 'sheet'로 분기합니다. 확인창에는 AlertDialog를 써서 바깥 클릭으로 실수로 닫히지 않게 합니다.",
        codeLabel: "ResponsiveDialog.tsx",
        codeLanguage: "tsx",
        code: `<DialogContent surface={isMobile ? "sheet" : "dialog"}>
  <DialogTitle>필터 설정</DialogTitle>
  {/* 모바일에서는 하단 시트 + 핸들 바, 데스크톱에서는 중앙 모달 */}
</DialogContent>`,
        renderDemo: () => <AdaptiveDialogDemo />,
      },
      {
        id: "touch-and-hover",
        title: "호버 대체와 터치 영역",
        problem:
          "모바일 터치 환경에는 마우스 호버와 우클릭이 없습니다. Tooltip이나 Preview Card 안에 필수 정보를 숨기면 모바일 사용자는 볼 수 없고, 우클릭 Context Menu만 두면 작업에 접근할 수 없습니다.",
        guidance:
          "호버 전용 컴포넌트는 보조 설명에만 쓰고, Context Menu 항목은 더보기(Menu) 버튼으로 함께 제공합니다. 모바일 주요 실행 버튼은 전체 폭(w-full)이나 size='lg'로 터치 영역을 확보합니다.",
        codeLabel: "MobileAction.tsx",
        codeLanguage: "tsx",
        code: `<Button size={isMobile ? "lg" : "default"} className={isMobile ? "w-full" : undefined}>
  저장
</Button>`,
      },
      {
        id: "dedicated-edit",
        title: "긴 입력·편집은 전용 페이지로",
        problem:
          "모바일에서 가상 키보드가 올라오면 화면의 절반 이상이 가려집니다. 여러 칸을 채우거나 긴 글을 편집하는 화면을 바텀시트나 모달에 넣으면 스크롤과 닫기 동작이 꼬입니다.",
        guidance:
          "긴 폼이나 본문 편집은 자기 주소를 가진 전용 페이지(…/edit)로 열어 새로고침과 뒤로가기 동작을 예측 가능하게 유지합니다.",
        codeLabel: "edit-route.tsx",
        codeLanguage: "tsx",
        code: `// 짧은 확인·필터 → Dialog / Sheet
// 긴 폼·본문 편집 → 전용 라우트 (/items/$id/edit)`,
      },
    ],
  },
  {
    slug: "route-masking",
    title: "라우팅 마스크",
    summary:
      "데스크톱에서는 목록 위 모달로 열면서 상세 URL을 표시하고, 새로고침·공유·모바일에서는 독립 상세 페이지로 전환하는 패턴입니다.",
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
  },
];

export function getDetailDoc(slug: string) {
  return DETAIL_DOCS.find((item) => item.slug === slug);
}
