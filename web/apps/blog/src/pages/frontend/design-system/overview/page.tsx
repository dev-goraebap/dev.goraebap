import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Glossed } from "@/shared/ui";
import { CodeExampleList, examplesFor, pageSkills } from "@/entities/code-example";

export const Route = createFileRoute("/frontend/design-system/overview/")({
  component: OverviewPage,
});

const STORY = [
  "안녕하세요. 이곳은 제가 관리하는 디자인 시스템을 둘러보실 수 있는 공간입니다. 웹 애플리케이션을 만들면서 생긴 고집이 하나 있습니다. 바퀴를 재발명하지 말라는 것입니다.",
  "AI 에이전트의 시대이기 때문에 만드는 비용은 매우 저렴해졌지만, 저는 여전히 관리 비용을 높게 생각하고 있습니다. 따라서 필요한 기술이 있다면 완성도 높고 관리가 잘 되는 오픈소스를 먼저 찾아 쓰는 방식을 선호합니다. 제 디자인 시스템 또한 처음부터 쌓아 올린 저만의 규칙이 아니라, 여러 오픈소스와 개념을 조합하고 관리하는 작업실일 뿐입니다.",
  "그렇기 때문에 오픈소스가 얼마나 잘 관리되는지, 만약 이 오픈소스가 사라진다면 어떤 대체재가 있는지까지 고민하는 것이 이 작업실의 과제인 것 같습니다.",
  "저는 주로 Angular를 사용해 오다가, AI로 인한 격변을 겪으며 개인 프로젝트에는 React를 쓰고 있습니다. 프론트엔드에서 좋은 오픈소스가 나오면 대부분 React 진영이고, 다양한 개념을 빠르게 접할 수 있기 때문입니다.",
  "저만의 디자인 시스템을 늘 구축하고 싶었지만 하나의 프론트엔드 프레임워크만 쓰는 것이 아니어서 진영마다 다르게 관리되는 도구를 챙길 엄두가 나지 않았습니다. 점점 발전하는 Web Component로 핵심 컴포넌트를 중앙 집중화하는 방법도 Web Awesome처럼 가능하겠다고 생각했지만, 프레임워크마다 얇은 어댑터가 또 필요해지고 각 프레임워크답지 않은 사용법이 남아 포기했습니다. 시대가 매우 빠르게 변하고 있어 나중에는 금방 달라질 수도 있겠지만요.",
  "따라서 관리 방식은 깔끔함과 과함 사이의 트레이드오프를 받아들이는 쪽으로 방향을 틀었습니다. 원래 주력으로 쓰던 Tailwind CSS를 중심으로 스타일 레시피를 중앙에서 관리하고, 구현 비용이 큰 웹 접근성 같은 헤드리스 프리미티브 계층은 각 진영에 자리 잡은 오픈소스를 적극적으로 씁니다. React는 shadcn/ui와 Base UI, Angular는 Spartan, Angular CDK, Angular가 직접 관리하는 Angular Aria 같은 도구 위에 UI 컴포넌트 어댑터를 만드는 방식을 택했습니다.",
  "shadcn/ui, Spartan, Astryx처럼 완성도 높은 컴포넌트 모음이 이미 많지만, 오픈소스는 결국 제 입맛에 맞게 한 번 더 가공해야 만족스러워지는 병이 있는 것 같습니다.",
];

const LAYER_ROLES = [
  {
    name: "디자인 토큰",
    package: "@goraebap/design-system/styles",
    owns: "5가지 색상 테마(Neutral·Editorial·Ocean·Forest·Terracotta), 면 위계, 반경, 폰트",
    boundary: "컴포넌트 모양이나 배치를 직접 정의하지 않습니다.",
    to: "/frontend/design-system/foundations/tokens" as const,
  },
  {
    name: "스타일 레시피",
    package: "@goraebap/design-system/recipes/*",
    owns: "tailwind-variants 기반 클래스 문자열, variant·size·shape 규칙",
    boundary: "프레임워크 런타임에 의존하지 않습니다.",
    to: "/frontend/design-system/foundations/recipes" as const,
  },
  {
    name: "어댑터 컴포넌트",
    package: "@goraebap/ui-react · Spartan 예시",
    owns: "키보드 탐색, 포커스 관리, 오버레이, 아이콘 어댑터(Solar·Lucide)",
    boundary: "색상과 여백 규칙을 새로 만들지 않고 레시피를 그대로 입힙니다.",
    to: "/frontend/design-system/components" as const,
  },
  {
    name: "레이아웃",
    package: "앱 외곽 · 메인 영역",
    owns: "워크스페이스·문서·단일 페이지 골격과 목록·상세·설정·폼 배치",
    boundary: "개별 컴포넌트 내부 스타일을 덮어쓰지 않습니다.",
    to: "/frontend/design-system/layouts" as const,
  },
  {
    name: "Interaction",
    package: "스크롤 · 전환 · 폰트 · 적응형 UI",
    owns: "화면 흔들림 방지, 지연 프로그레스바, View Transition, 모바일 전환 기준",
    boundary: "정답을 강제하기보다 프로젝트를 만들며 꾸준히 챙기는 마감 기준입니다.",
    to: "/frontend/interaction" as const,
  },
];

function ArchitectureDiagram() {
  return (
    <div className="border-border bg-dots bg-background/70 space-y-6 rounded-2xl border p-5 sm:p-7">
      {/* Shared Core */}
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="border-border bg-card rounded-xl border p-4 text-center shadow-xs">
          <p className="text-muted-foreground font-mono text-[0.6875rem] uppercase">
            Single Source · Framework-Agnostic
          </p>
          <p className="mt-1 text-sm font-semibold">@goraebap/design-system</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="border-border bg-background rounded-lg border px-3 py-2 text-left">
              <p className="text-xs font-semibold">
                <Glossed>{"디자인 토큰 (CSS Variables)"}</Glossed>
              </p>
              <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">
                5 Themes (Light/Dark) · Radius · Font
              </p>
            </div>
            <div className="border-border bg-background rounded-lg border px-3 py-2 text-left">
              <p className="text-xs font-semibold">
                <Glossed>{"스타일 레시피 (tailwind-variants)"}</Glossed>
              </p>
              <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">
                프레임워크에 의존하지 않는 TypeScript 함수
              </p>
            </div>
          </div>
        </div>

        {/* Connector SVG */}
        <svg
          viewBox="0 0 600 44"
          fill="none"
          aria-hidden="true"
          className="text-border mx-auto hidden h-10 w-full max-w-xl sm:block"
        >
          <path d="M300 0V20" stroke="currentColor" strokeWidth="1.5" />
          <path d="M150 20H450" stroke="currentColor" strokeWidth="1.5" />
          <path d="M150 20V44M450 20V44" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 2 Adapters */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-card space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">React</span>
            <Badge variant="secondary" className="text-[0.625rem]">
              개인 프로젝트
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Base UI 프리미티브 위에 같은 레시피와 아이콘 어댑터를 결합해 패키지로 제공합니다.
          </p>
          <p className="text-muted-foreground font-mono text-[0.6875rem]">@goraebap/ui-react</p>
        </div>

        <div className="border-border bg-card space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Angular</span>
            <Badge variant="outline" className="text-[0.625rem]">
              업무 프로젝트
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Spartan Brain 프리미티브에 완전히 같은 레시피 함수를 연결해 동일한 UI를 유지합니다.
          </p>
          <p className="text-muted-foreground font-mono text-[0.6875rem]">
            @spartan-ng/brain + Recipes
          </p>
        </div>
      </div>
    </div>
  );
}

function OverviewPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">디자인 시스템</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          제품의 화면을 일관되게 만들기 위해 토큰, 컴포넌트, 사용 원칙과 문서를 함께 관리하는 체계
        </p>
      </header>

      <section className="space-y-4">
        {STORY.map((paragraph) => (
          <p key={paragraph} className="text-foreground/90 text-base leading-7">
            {paragraph}
          </p>
        ))}
      </section>

      <Separator variant="wave" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">단일 원본과 어댑터 분리</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          <Glossed>
            {
              "해결책은 시각 규칙(토큰과 스타일 레시피)에서 프레임워크를 완전히 걷어내는 것입니다. 상호작용이 필요한 컴포넌트만 React의 Base UI와 Angular의 Spartan Brain 같은 헤드리스 프리미티브로 감싸고, 색·여백·반경·모션은 모두 같은 원본에서 가져옵니다."
            }
          </Glossed>
        </p>
        <ArchitectureDiagram />
      </section>

      <Separator variant="wave" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">영역별 역할 경계</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          <Glossed>
            {
              "각 영역이 책임지는 범위를 나누어 두면, 색상 테마를 바꾸거나 프레임워크를 옮겨도 수정 범위가 한 곳에 머뭅니다."
            }
          </Glossed>
        </p>
        <div className="space-y-2.5">
          {LAYER_ROLES.map((layer) => (
            <Link
              key={layer.name}
              to={layer.to}
              className="border-border bg-card hover:border-foreground/30 grid grid-cols-1 gap-2 rounded-2xl border p-4 transition-colors sm:grid-cols-12 sm:items-center"
            >
              <div className="min-w-0 sm:col-span-3">
                <p className="text-sm font-semibold">{layer.name}</p>
                <p className="text-muted-foreground font-mono text-[0.6875rem] break-all">
                  {layer.package}
                </p>
              </div>
              <div className="sm:col-span-5">
                <p className="text-foreground text-sm leading-relaxed">{layer.owns}</p>
              </div>
              <div className="sm:col-span-4">
                <p className="text-muted-foreground text-sm leading-relaxed">{layer.boundary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CodeExampleList examples={examplesFor(pageSkills("/frontend/design-system/overview"))} />
    </article>
  );
}
