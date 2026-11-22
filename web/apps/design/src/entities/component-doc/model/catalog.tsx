import type { ReactNode } from "react";
import { alertVariants } from "@goraebap/design-system/recipes/alert";
import { badgeVariants } from "@goraebap/design-system/recipes/badge";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { cardVariants } from "@goraebap/design-system/recipes/card";
import { inputVariants } from "@goraebap/design-system/recipes/input";
import { separatorVariants } from "@goraebap/design-system/recipes/separator";
import { skeletonVariants } from "@goraebap/design-system/recipes/skeleton";
import {
  tableCellVariants,
  tableHeadVariants,
  tableRowVariants,
  tableVariants,
} from "@goraebap/design-system/recipes/table";
import { textareaVariants } from "@goraebap/design-system/recipes/textarea";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@goraebap/ui-react/components/card";
import { Input } from "@goraebap/ui-react/components/input";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Skeleton } from "@goraebap/ui-react/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { Textarea } from "@goraebap/ui-react/components/textarea";
import {
  NativeAlertDialogDemo,
  NativeMenuDemo,
  NativePopoverDemo,
  NativeSelectDemo,
  NativeToggleDemo,
  NativeToggleGroupDemo,
  NativeTooltipDemo,
  ReactAlertDialogDemo,
  ReactMenuDemo,
  ReactPopoverDemo,
  ReactSelectDemo,
  ReactToggleDemo,
  ReactToggleGroupDemo,
  ReactTooltipDemo,
} from "../ui/Batch1Demos";
import {
  NativeCheckboxDemo,
  NativeDialogDemo,
  NativeSwitchDemo,
  NativeTabsDemo,
  ReactCheckboxDemo,
  ReactDialogDemo,
  ReactSwitchDemo,
} from "../ui/InteractiveDemos";

export type ComponentCategory = "동작과 입력" | "표시와 구조" | "오버레이와 탐색";

export interface ComponentExample {
  id: string;
  title: string;
  description?: string;
  htmlCode: string;
  reactCode: string;
  angularCode: string;
  renderHtmlDemo: (ctx: { isMobile: boolean }) => ReactNode;
  renderReactDemo: (ctx: { isMobile: boolean }) => ReactNode;
}

export interface ComponentDocSpec {
  slug: string;
  name: string;
  category: ComponentCategory;
  primitiveReact: string;
  primitiveAngular: string;
  recipePath: string;
  pureHtmlLevel: "100% Native HTML" | "Native HTML + CSS" | "Native HTML (한계 있음)";
  summary: string;
  pureHtmlNote: string;
  mobileGuideline: string;
  htmlCode: string;
  reactCode: string;
  angularCode: string;
  renderThumbnail: () => ReactNode;
  renderHtmlDemo: (ctx: { isMobile: boolean }) => ReactNode;
  renderReactDemo: (ctx: { isMobile: boolean }) => ReactNode;
  examples?: ComponentExample[];
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "동작과 입력",
  "표시와 구조",
  "오버레이와 탐색",
];

export const COMPONENT_DOCS: ComponentDocSpec[] = [
  {
    slug: "button",
    name: "Button",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/button",
    primitiveAngular: "HTML <button> / hlmBtn",
    recipePath: "@goraebap/design-system/recipes/button",
    pureHtmlLevel: "100% Native HTML",
    summary:
      "동작을 실행하거나 링크로 이동하는 버튼입니다. Pure HTML <button>, React, Angular 예시 모두 같은 레시피를 씁니다.",
    pureHtmlNote:
      "네이티브 <button>만으로 포커스, Enter와 Space 키 입력, 비활성화가 동작합니다. React와 Angular 어댑터는 라우터 링크 합성(render prop, directive)을 처리합니다.",
    mobileGuideline:
      "모바일에서는 주요 동작 버튼을 전체 폭(w-full)이나 size='lg' 이상으로 배치합니다.",
    htmlCode: `<button class="\${buttonVariants({ variant: 'default' })}">저장</button>
<button class="\${buttonVariants({ variant: 'secondary' })}">임시 저장</button>
<button class="\${buttonVariants({ variant: 'outline' })}">미리보기</button>
<button class="\${buttonVariants({ variant: 'ghost' })}">취소</button>
<button class="\${buttonVariants({ variant: 'destructive' })}">삭제</button>`,
    reactCode: `import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>저장</Button>
      <Button variant="secondary">임시 저장</Button>
      <Button variant="outline">미리보기</Button>
      <Button variant="ghost">취소</Button>
      <Button variant="destructive">삭제</Button>
    </div>
  );
}`,
    angularCode: `import { Directive, computed, input } from "@angular/core";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";

@Directive({
  selector: "button[gbButton], a[gbButton]",
  host: { "[class]": "computedClass()" },
})
export class GbButtonDirective {
  variant = input<ButtonRecipeProps["variant"]>("default");
  size = input<ButtonRecipeProps["size"]>("default");
  shape = input<ButtonRecipeProps["shape"]>("default");
  computedClass = computed(() =>
    buttonVariants({ variant: this.variant(), size: this.size(), shape: this.shape() }),
  );
}`,
    renderThumbnail: () => (
      <div className="flex items-center gap-1.5">
        <span className={buttonVariants({ size: "sm" })}>Primary</span>
        <span className={buttonVariants({ variant: "secondary", size: "sm" })}>Secondary</span>
        <span className={buttonVariants({ variant: "destructive", size: "sm" })}>Delete</span>
      </div>
    ),
    renderHtmlDemo: ({ isMobile }) => (
      <div
        className={
          isMobile
            ? "flex flex-col gap-2"
            : "flex flex-wrap items-center justify-center gap-2.5 py-4"
        }
      >
        <button type="button" className={buttonVariants({ size: isMobile ? "lg" : "default" })}>
          저장
        </button>
        <button
          type="button"
          className={buttonVariants({ variant: "secondary", size: isMobile ? "lg" : "default" })}
        >
          임시 저장
        </button>
        <button
          type="button"
          className={buttonVariants({ variant: "outline", size: isMobile ? "lg" : "default" })}
        >
          미리보기
        </button>
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: isMobile ? "lg" : "default" })}
        >
          취소
        </button>
        <button
          type="button"
          className={buttonVariants({ variant: "destructive", size: isMobile ? "lg" : "default" })}
        >
          삭제
        </button>
      </div>
    ),
    renderReactDemo: ({ isMobile }) => (
      <div
        className={
          isMobile
            ? "flex flex-col gap-2"
            : "flex flex-wrap items-center justify-center gap-2.5 py-4"
        }
      >
        <Button size={isMobile ? "lg" : "default"}>저장</Button>
        <Button size={isMobile ? "lg" : "default"} variant="secondary">
          임시 저장
        </Button>
        <Button size={isMobile ? "lg" : "default"} variant="outline">
          미리보기
        </Button>
        <Button size={isMobile ? "lg" : "default"} variant="ghost">
          취소
        </Button>
        <Button size={isMobile ? "lg" : "default"} variant="destructive">
          삭제
        </Button>
      </div>
    ),
    examples: [
      {
        id: "pill",
        title: "Shape (Pill)",
        description: "랜딩 CTA, 헤더 액션, 필터 버튼처럼 둥근 형태가 필요할 때 shape='pill'을 씁니다.",
        htmlCode: `<button class="\${buttonVariants({ shape: 'pill' })}">시작하기</button>
<button class="\${buttonVariants({ variant: 'secondary', shape: 'pill' })}">컴포넌트 보기</button>
<button class="\${buttonVariants({ variant: 'outline', shape: 'pill' })}">문서 보기</button>`,
        reactCode: `import { Button } from "@goraebap/ui-react/components/button";

export function PillButtonExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button shape="pill">시작하기</Button>
      <Button variant="secondary" shape="pill">컴포넌트 보기</Button>
      <Button variant="outline" shape="pill">문서 보기</Button>
    </div>
  );
}`,
        angularCode: `<button gbButton shape="pill">시작하기</button>
<button gbButton variant="secondary" shape="pill">컴포넌트 보기</button>
<button gbButton variant="outline" shape="pill">문서 보기</button>`,
        renderHtmlDemo: ({ isMobile }) => (
          <div
            className={
              isMobile
                ? "flex flex-col gap-2"
                : "flex flex-wrap items-center justify-center gap-2.5 py-4"
            }
          >
            <button
              type="button"
              className={buttonVariants({ shape: "pill", size: isMobile ? "lg" : "default" })}
            >
              시작하기
            </button>
            <button
              type="button"
              className={buttonVariants({
                variant: "secondary",
                shape: "pill",
                size: isMobile ? "lg" : "default",
              })}
            >
              컴포넌트 보기
            </button>
            <button
              type="button"
              className={buttonVariants({
                variant: "outline",
                shape: "pill",
                size: isMobile ? "lg" : "default",
              })}
            >
              문서 보기
            </button>
          </div>
        ),
        renderReactDemo: ({ isMobile }) => (
          <div
            className={
              isMobile
                ? "flex flex-col gap-2"
                : "flex flex-wrap items-center justify-center gap-2.5 py-4"
            }
          >
            <Button shape="pill" size={isMobile ? "lg" : "default"}>
              시작하기
            </Button>
            <Button variant="secondary" shape="pill" size={isMobile ? "lg" : "default"}>
              컴포넌트 보기
            </Button>
            <Button variant="outline" shape="pill" size={isMobile ? "lg" : "default"}>
              문서 보기
            </Button>
          </div>
        ),
      },
      {
        id: "size",
        title: "Size",
        description: "툴바와 보조 동작은 sm, 일반 동작은 default, 모바일 주요 버튼은 lg를 씁니다.",
        htmlCode: `<button class="\${buttonVariants({ size: 'sm' })}">Small</button>
<button class="\${buttonVariants({ size: 'default' })}">Default</button>
<button class="\${buttonVariants({ size: 'lg' })}">Large</button>`,
        reactCode: `import { Button } from "@goraebap/ui-react/components/button";

export function SizeButtonExample() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}`,
        angularCode: `<button gbButton size="sm">Small</button>
<button gbButton size="default">Default</button>
<button gbButton size="lg">Large</button>`,
        renderHtmlDemo: () => (
          <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
            <button type="button" className={buttonVariants({ size: "sm" })}>
              Small
            </button>
            <button type="button" className={buttonVariants({ size: "default" })}>
              Default
            </button>
            <button type="button" className={buttonVariants({ size: "lg" })}>
              Large
            </button>
          </div>
        ),
        renderReactDemo: () => (
          <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        ),
      },
    ],
  },
  {
    slug: "input",
    name: "Input",
    category: "동작과 입력",
    primitiveReact: "HTML <input>",
    primitiveAngular: "HTML <input>",
    recipePath: "@goraebap/design-system/recipes/input",
    pureHtmlLevel: "100% Native HTML",
    summary:
      "한 줄 텍스트를 입력하는 칸입니다. invalid 상태로 오류 테두리와 aria-invalid를 함께 표시합니다.",
    pureHtmlNote:
      "네이티브 <input>에 inputVariants() 클래스를 적용하면 focus-visible, disabled, aria-invalid 스타일이 동작합니다.",
    mobileGuideline:
      "모바일 Safari 자동 확대를 막기 위해 14px~16px 글자 크기와 충분한 터치 높이를 유지합니다.",
    htmlCode: `<input class="\${inputVariants()}" placeholder="name@goraebap.xyz" />
<input class="\${inputVariants({ invalid: true })}" aria-invalid="true" value="invalid-email" />`,
    reactCode: `import { Input } from "@goraebap/ui-react/components/input";

export function Example() {
  return (
    <div className="space-y-3">
      <Input placeholder="name@goraebap.xyz" />
      <Input invalid defaultValue="invalid-email" />
    </div>
  );
}`,
    angularCode: `<input [class]="inputVariants()" placeholder="name@goraebap.xyz" />
<input [class]="inputVariants({ invalid: hasError() })" [attr.aria-invalid]="hasError()" />`,
    renderThumbnail: () => (
      <div className="w-48">
        <div className="border-input bg-background text-muted-foreground rounded-md border px-3 py-1.5 text-xs">
          name@goraebap.xyz
        </div>
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="mx-auto max-w-sm space-y-3">
        <input type="email" className={inputVariants()} placeholder="name@goraebap.xyz" />
        <input
          type="text"
          aria-invalid="true"
          className={inputVariants({ invalid: true })}
          defaultValue="잘못된 이메일 형식"
        />
        <input
          type="text"
          disabled
          className={inputVariants()}
          value="비활성화된 입력 칸"
          readOnly
        />
      </div>
    ),
    renderReactDemo: () => (
      <div className="mx-auto max-w-sm space-y-3">
        <Input placeholder="name@goraebap.xyz" />
        <Input invalid defaultValue="잘못된 이메일 형식" />
        <Input disabled value="비활성화된 입력 칸" readOnly />
      </div>
    ),
  },
  {
    slug: "textarea",
    name: "Textarea",
    category: "동작과 입력",
    primitiveReact: "HTML <textarea>",
    primitiveAngular: "HTML <textarea>",
    recipePath: "@goraebap/design-system/recipes/textarea",
    pureHtmlLevel: "100% Native HTML",
    summary: "여러 줄 설명이나 메모를 작성하는 입력 칸입니다.",
    pureHtmlNote:
      "네이티브 <textarea>에 textareaVariants() 클래스를 적용해 프레임워크 없이 씁니다.",
    mobileGuideline:
      "긴 글 입력은 대화상자 대신 전용 페이지에서 전체 폭으로 열어야 가상 키보드에 가리지 않습니다.",
    htmlCode: `<textarea class="\${textareaVariants()}" placeholder="변경 이유나 맥락을 적어 주세요."></textarea>`,
    reactCode: `import { Textarea } from "@goraebap/ui-react/components/textarea";

export function Example() {
  return <Textarea placeholder="변경 이유나 맥락을 적어 주세요." />;
}`,
    angularCode: `<textarea [class]="textareaVariants()" placeholder="변경 이유나 맥락을 적어 주세요."></textarea>`,
    renderThumbnail: () => (
      <div className="border-input bg-background text-muted-foreground h-14 w-48 rounded-md border p-2 text-[11px]">
        변경 이유를 적어 주세요...
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="mx-auto max-w-md">
        <textarea
          className={textareaVariants()}
          placeholder="변경 이유나 맥락을 간단히 적어 주세요."
        />
      </div>
    ),
    renderReactDemo: () => (
      <div className="mx-auto max-w-md">
        <Textarea placeholder="변경 이유나 맥락을 간단히 적어 주세요." />
      </div>
    ),
  },
  {
    slug: "switch",
    name: "Switch",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/switch",
    primitiveAngular: "@spartan-ng/brain/switch",
    recipePath: "@goraebap/design-system/recipes/switch",
    pureHtmlLevel: "Native HTML + CSS",
    summary: "즉시 반영되는 켜짐/꺼짐 설정에 쓰는 토글 스위치입니다.",
    pureHtmlNote:
      "<button role='switch' aria-checked>로 외형과 클릭은 구현할 수 있습니다. 폼 제출(name, value), 키보드 입력 처리, 라벨 연결은 Base UI나 Spartan Brain에서 처리합니다.",
    mobileGuideline: "스위치와 설명 사이 여백과 행 높이를 넉넉히 두어 터치 영역을 확보합니다.",
    htmlCode: `<button role="switch" aria-checked="true" data-checked class="\${switchTrackVariants()}">
  <span data-checked class="\${switchThumbVariants()}"></span>
</button>`,
    reactCode: `import { Switch } from "@goraebap/ui-react/components/switch";

export function Example() {
  return <Switch defaultChecked aria-label="이메일 알림 받기" />;
}`,
    angularCode: `<brn-switch [class]="switchTrackVariants()" [(checked)]="enabled">
  <brn-switch-thumb [class]="switchThumbVariants()" />
</brn-switch>`,
    renderThumbnail: () => (
      <div className="flex items-center gap-3">
        <div className="bg-primary flex h-5 w-9 items-center rounded-full p-0.5">
          <div className="bg-primary-foreground size-4 translate-x-4 rounded-full" />
        </div>
        <div className="bg-input flex h-5 w-9 items-center rounded-full p-0.5">
          <div className="bg-background size-4 rounded-full" />
        </div>
      </div>
    ),
    renderHtmlDemo: () => <NativeSwitchDemo />,
    renderReactDemo: () => <ReactSwitchDemo />,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/checkbox",
    primitiveAngular: "@spartan-ng/brain/checkbox",
    recipePath: "@goraebap/design-system/recipes/checkbox",
    pureHtmlLevel: "100% Native HTML",
    summary: "여러 항목을 고르거나 동의 여부를 확인하는 체크박스입니다.",
    pureHtmlNote:
      "네이티브 <input type='checkbox'>로 선택과 폼 제출이 동작합니다. 커스텀 체크 아이콘과 indeterminate(부분 선택) 상태 스타일은 헤드리스 프리미티브로 맞춥니다.",
    mobileGuideline: "라벨 텍스트 전체를 클릭 영역으로 묶어 모바일 터치 영역을 넓힙니다.",
    htmlCode: `<label class="flex items-center gap-2">
  <input type="checkbox" checked class="\${checkboxVariants()}" />
  <span>모든 기기 세션 유지</span>
</label>`,
    reactCode: `import { Checkbox } from "@goraebap/ui-react/components/checkbox";

export function Example() {
  return <Checkbox defaultChecked aria-label="세션 유지" />;
}`,
    angularCode: `<brn-checkbox [class]="checkboxVariants()" [(checked)]="keepSession" />`,
    renderThumbnail: () => (
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-primary text-primary-foreground inline-flex size-4 items-center justify-center rounded text-[10px]">
          ✓
        </span>
        <span className="text-foreground">세션 유지</span>
      </div>
    ),
    renderHtmlDemo: () => <NativeCheckboxDemo />,
    renderReactDemo: () => <ReactCheckboxDemo />,
  },
  {
    slug: "badge",
    name: "Badge",
    category: "표시와 구조",
    primitiveReact: "HTML <span>",
    primitiveAngular: "HTML <span>",
    recipePath: "@goraebap/design-system/recipes/badge",
    pureHtmlLevel: "100% Native HTML",
    summary: "상태, 역할, 분류처럼 짧은 메타데이터를 표시합니다.",
    pureHtmlNote: "네이티브 <span>에 badgeVariants() 클래스를 적용해 씁니다.",
    mobileGuideline: "좁은 폭에서 배지가 가로로 넘치지 않도록 flex-wrap과 함께 씁니다.",
    htmlCode: `<span class="\${badgeVariants({ variant: 'default' })}">원칙</span>
<span class="\${badgeVariants({ variant: 'secondary' })}">진행 중</span>
<span class="\${badgeVariants({ variant: 'outline' })}">Pure HTML</span>`,
    reactCode: `import { Badge } from "@goraebap/ui-react/components/badge";

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">원칙</Badge>
      <Badge variant="secondary">진행 중</Badge>
      <Badge variant="outline">Base UI</Badge>
      <Badge variant="muted">보관됨</Badge>
      <Badge variant="destructive">만료됨</Badge>
    </div>
  );
}`,
    angularCode: `<span [class]="badgeVariants({ variant: 'outline' })">Spartan Brain</span>`,
    renderThumbnail: () => (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className={badgeVariants({ variant: "default" })}>Token</span>
        <span className={badgeVariants({ variant: "secondary" })}>Recipe</span>
        <span className={badgeVariants({ variant: "outline" })}>HTML</span>
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        <span className={badgeVariants({ variant: "default" })}>원칙</span>
        <span className={badgeVariants({ variant: "secondary" })}>진행 중</span>
        <span className={badgeVariants({ variant: "outline" })}>Pure HTML</span>
        <span className={badgeVariants({ variant: "muted" })}>보관됨</span>
        <span className={badgeVariants({ variant: "destructive" })}>만료됨</span>
      </div>
    ),
    renderReactDemo: () => (
      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        <Badge variant="default">원칙</Badge>
        <Badge variant="secondary">진행 중</Badge>
        <Badge variant="outline">Base UI</Badge>
        <Badge variant="muted">보관됨</Badge>
        <Badge variant="destructive">만료됨</Badge>
      </div>
    ),
  },
  {
    slug: "card",
    name: "Card",
    category: "표시와 구조",
    primitiveReact: "HTML <div>",
    primitiveAngular: "HTML <article>",
    recipePath: "@goraebap/design-system/recipes/card",
    pureHtmlLevel: "100% Native HTML",
    summary: "페이지 면(--background) 위에 한 단계 올라오는 올린 면(--card) 컨테이너입니다.",
    pureHtmlNote: "네이티브 <article>에 cardVariants() 클래스를 적용해 구성합니다.",
    mobileGuideline:
      "모바일에서는 카드 안쪽 여백을 p-4~p-5로 유지하고, 불필요한 중첩 카드를 피합니다.",
    htmlCode: `<article class="\${cardVariants()}">
  <header class="space-y-1 p-5 pb-3">
    <h3 class="text-sm font-semibold">에이전트 토큰</h3>
    <p class="text-muted-foreground text-xs">MCP 서버 접근용 개인 토큰</p>
  </header>
  <div class="px-5 pb-5 text-xs">활성 토큰 2개</div>
</article>`,
    reactCode: `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@goraebap/ui-react/components/card";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>에이전트 토큰</CardTitle>
        <CardDescription>MCP 서버 접근을 위한 개인 토큰입니다.</CardDescription>
      </CardHeader>
      <CardContent>활성 토큰 2개</CardContent>
      <CardFooter>
        <Button size="sm">새 토큰 발급</Button>
      </CardFooter>
    </Card>
  );
}`,
    angularCode: `<article [class]="cardVariants()">
  <div class="p-5"><h3 class="text-sm font-semibold">에이전트 토큰</h3></div>
</article>`,
    renderThumbnail: () => (
      <div className="border-border bg-card w-44 rounded-lg border p-3 text-left">
        <div className="text-foreground text-xs font-medium">에이전트 토큰</div>
        <div className="text-muted-foreground mt-0.5 text-[10px]">활성 2개 · MCP</div>
      </div>
    ),
    renderHtmlDemo: () => (
      <article className={`mx-auto max-w-sm ${cardVariants()}`}>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold tracking-tight">에이전트 토큰</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            MCP 서버 접근을 위한 개인 토큰을 관리합니다.
          </p>
        </div>
        <div className="pt-4">
          <p className="text-muted-foreground font-mono text-xs">
            활성 토큰 2개 · 마지막 사용 10분 전
          </p>
        </div>
        <div className="flex items-center gap-2 pt-4">
          <button type="button" className={buttonVariants({ size: "sm" })}>
            새 토큰 발급
          </button>
          <button type="button" className={buttonVariants({ size: "sm", variant: "ghost" })}>
            목록 보기
          </button>
        </div>
      </article>
    ),
    renderReactDemo: () => (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>에이전트 토큰</CardTitle>
          <CardDescription>MCP 서버 접근을 위한 개인 토큰을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-mono text-xs">
            활성 토큰 2개 · 마지막 사용 10분 전
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">새 토큰 발급</Button>
          <Button size="sm" variant="ghost">
            목록 보기
          </Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    slug: "alert",
    name: "Alert",
    category: "표시와 구조",
    primitiveReact: "HTML <div role='alert'>",
    primitiveAngular: "HTML <div role='alert'>",
    recipePath: "@goraebap/design-system/recipes/alert",
    pureHtmlLevel: "100% Native HTML",
    summary: "중요한 안내, 성공, 경고, 오류 메시지를 문맥 안에 인라인으로 알립니다.",
    pureHtmlNote: "role='alert' 속성과 alertVariants() 클래스를 함께 적용해 씁니다.",
    mobileGuideline: "모바일에서도 제목과 본문이 2~3줄을 넘지 않도록 짧게 씁니다.",
    htmlCode: `<div role="alert" class="\${alertVariants({ variant: 'info' })}">
  <h5 class="font-medium">서브도메인 SSO 활성화</h5>
  <p class="mt-1 text-xs opacity-90">*.goraebap.xyz 전체에 세션이 공유됩니다.</p>
</div>`,
    reactCode: `import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";

export function Example() {
  return (
    <Alert variant="info">
      <AlertTitle>서브도메인 SSO 활성화</AlertTitle>
      <AlertDescription>로그인 세션이 *.goraebap.xyz 전체에 공유됩니다.</AlertDescription>
    </Alert>
  );
}`,
    angularCode: `<div role="alert" [class]="alertVariants({ variant: 'info' })">
  <h5 class="font-medium">서브도메인 SSO 활성화</h5>
</div>`,
    renderThumbnail: () => (
      <div className={`w-48 !p-2.5 text-left ${alertVariants({ variant: "info" })}`}>
        <div className="text-[11px] font-medium">서브도메인 SSO</div>
        <div className="text-[10px] opacity-80">세션 공유 활성화됨</div>
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="mx-auto max-w-md space-y-3">
        <div role="alert" className={alertVariants({ variant: "info" })}>
          <h5>서브도메인 SSO 활성화</h5>
          <p>로그인 세션이 *.goraebap.xyz 전체에 공유됩니다.</p>
        </div>
        <div role="alert" className={alertVariants({ variant: "success" })}>
          <h5>저장 완료</h5>
          <p>변경한 프로필 이름이 모든 서비스에 반영되었습니다.</p>
        </div>
        <div role="alert" className={alertVariants({ variant: "destructive" })}>
          <h5>인증 코드 만료</h5>
          <p>5분이 지나 코드가 만료되었습니다. 다시 요청해 주세요.</p>
        </div>
      </div>
    ),
    renderReactDemo: () => (
      <div className="mx-auto max-w-md space-y-3">
        <Alert variant="info">
          <AlertTitle>서브도메인 SSO 활성화</AlertTitle>
          <AlertDescription>로그인 세션이 *.goraebap.xyz 전체에 공유됩니다.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <AlertTitle>저장 완료</AlertTitle>
          <AlertDescription>변경한 프로필 이름이 모든 서비스에 반영되었습니다.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>인증 코드 만료</AlertTitle>
          <AlertDescription>5분이 지나 코드가 만료되었습니다. 다시 요청해 주세요.</AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    slug: "separator",
    name: "Separator",
    category: "표시와 구조",
    primitiveReact: "@base-ui/react/separator",
    primitiveAngular: "@spartan-ng/brain/separator",
    recipePath: "@goraebap/design-system/recipes/separator",
    pureHtmlLevel: "100% Native HTML",
    summary: "영역이나 항목 사이를 --border 1px 선으로 나눕니다.",
    pureHtmlNote:
      "가로 구분선은 <hr>, 세로 구분선은 role='separator' aria-orientation='vertical'로 충분합니다.",
    mobileGuideline: "구분선 대신 여백으로 묶음이 충분하면 선을 생략해 화면 밀도를 낮춥니다.",
    htmlCode: `<hr class="\${separatorVariants({ orientation: 'horizontal' })}" />`,
    reactCode: `import { Separator } from "@goraebap/ui-react/components/separator";

export function Example() {
  return <Separator />;
}`,
    angularCode: `<brn-separator [class]="separatorVariants({ orientation: 'horizontal' })" />`,
    renderThumbnail: () => (
      <div className="w-40 space-y-2">
        <div className="bg-muted-foreground/30 h-2 w-16 rounded" />
        <hr className={separatorVariants({ orientation: "horizontal" })} />
        <div className="bg-muted-foreground/20 h-2 w-24 rounded" />
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="border-border bg-card mx-auto max-w-sm space-y-3 rounded-xl border p-5">
        <p className="text-sm font-medium">계정 정보</p>
        <hr className={separatorVariants({ orientation: "horizontal" })} />
        <div className="text-muted-foreground flex h-5 items-center gap-3 text-xs">
          <span>프로필</span>
          <div
            role="separator"
            aria-orientation="vertical"
            className={separatorVariants({ orientation: "vertical" })}
          />
          <span>세션</span>
          <div
            role="separator"
            aria-orientation="vertical"
            className={separatorVariants({ orientation: "vertical" })}
          />
          <span>토큰</span>
        </div>
      </div>
    ),
    renderReactDemo: () => (
      <div className="border-border bg-card mx-auto max-w-sm space-y-3 rounded-xl border p-5">
        <p className="text-sm font-medium">계정 정보</p>
        <Separator />
        <div className="text-muted-foreground flex h-5 items-center gap-3 text-xs">
          <span>프로필</span>
          <Separator orientation="vertical" />
          <span>세션</span>
          <Separator orientation="vertical" />
          <span>토큰</span>
        </div>
      </div>
    ),
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    category: "표시와 구조",
    primitiveReact: "HTML <div>",
    primitiveAngular: "HTML <div>",
    recipePath: "@goraebap/design-system/recipes/skeleton",
    pureHtmlLevel: "100% Native HTML",
    summary: "데이터를 불러오는 동안 콘텐츠가 들어갈 자리를 미리 표시합니다.",
    pureHtmlNote: "네이티브 <div aria-hidden='true'>에 skeletonVariants() 클래스를 적용해 씁니다.",
    mobileGuideline:
      "화면 전체 스켈레톤 대신 실제 카드/줄 높이에 맞춘 최소한의 자리 표시만 씁니다.",
    htmlCode: `<div class="\${skeletonVariants({ shape: 'circle' })} size-10"></div>
<div class="\${skeletonVariants({ shape: 'line' })} w-1/2"></div>`,
    reactCode: `import { Skeleton } from "@goraebap/ui-react/components/skeleton";

export function Example() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <Skeleton shape="line" className="w-1/2" />
    </div>
  );
}`,
    angularCode: `<div aria-hidden="true" [class]="skeletonVariants({ shape: 'line' })"></div>`,
    renderThumbnail: () => (
      <div className="flex w-44 items-center gap-2.5">
        <div className={`size-8 shrink-0 ${skeletonVariants({ shape: "circle" })}`} />
        <div className="flex-1 space-y-1.5">
          <div className={`w-2/3 ${skeletonVariants({ shape: "line" })}`} />
          <div className={`w-full ${skeletonVariants({ shape: "line" })}`} />
        </div>
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="border-border bg-card mx-auto flex max-w-sm items-center gap-3 rounded-xl border p-4">
        <div
          aria-hidden="true"
          className={`size-10 shrink-0 ${skeletonVariants({ shape: "circle" })}`}
        />
        <div className="flex-1 space-y-2">
          <div aria-hidden="true" className={`w-1/2 ${skeletonVariants({ shape: "line" })}`} />
          <div aria-hidden="true" className={`w-4/5 ${skeletonVariants({ shape: "line" })}`} />
        </div>
      </div>
    ),
    renderReactDemo: () => (
      <div className="border-border bg-card mx-auto flex max-w-sm items-center gap-3 rounded-xl border p-4">
        <Skeleton shape="circle" className="size-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="line" className="w-1/2" />
          <Skeleton shape="line" className="w-4/5" />
        </div>
      </div>
    ),
  },
  {
    slug: "table",
    name: "Table",
    category: "표시와 구조",
    primitiveReact: "HTML <table>",
    primitiveAngular: "HTML <table>",
    recipePath: "@goraebap/design-system/recipes/table",
    pureHtmlLevel: "100% Native HTML",
    summary: "여러 항목의 속성을 같은 열 기준으로 비교하는 표입니다.",
    pureHtmlNote: "네이티브 <table> 요소에 tableVariants() 클래스를 적용해 씁니다.",
    mobileGuideline:
      "가로 스크롤 래퍼로 넘침을 막고, 모바일에서 열이 많으면 카드 목록으로 바꿉니다.",
    htmlCode: `<div class="w-full overflow-x-auto">
  <table class="\${tableVariants()}">
    <thead><tr class="\${tableRowVariants()}"><th class="px-3 py-2 text-left">서비스</th></tr></thead>
    <tbody><tr class="\${tableRowVariants()}"><td class="px-3 py-2">apps/design</td></tr></tbody>
  </table>
</div>`,
    reactCode: `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@goraebap/ui-react/components/table";

export function Example() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>서비스</TableHead>
          <TableHead>어댑터</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>apps/design</TableCell>
          <TableCell>Pure HTML + React</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}`,
    angularCode: `<table [class]="tableVariants()">...</table>`,
    renderThumbnail: () => (
      <div className="border-border bg-card w-44 overflow-hidden rounded-md border text-[10px]">
        <div className="border-border bg-muted/50 flex justify-between border-b px-2 py-1 font-medium">
          <span>App</span>
          <span>Adapter</span>
        </div>
        <div className="flex justify-between px-2 py-1">
          <span>design</span>
          <span className="text-muted-foreground">HTML/React</span>
        </div>
        <div className="border-border/60 flex justify-between border-t px-2 py-1">
          <span>accounts</span>
          <span className="text-muted-foreground">Angular</span>
        </div>
      </div>
    ),
    renderHtmlDemo: () => (
      <div className="border-border bg-card rounded-xl border">
        <div className="w-full overflow-x-auto">
          <table className={tableVariants()}>
            <thead className="[&_tr]:border-b">
              <tr className={tableRowVariants()}>
                <th className={tableHeadVariants()}>서비스</th>
                <th className={tableHeadVariants()}>어댑터</th>
                <th className={tableHeadVariants()}>테마</th>
                <th className={tableHeadVariants()}>상태</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              <tr className={tableRowVariants()}>
                <td className={`${tableCellVariants()} font-medium`}>apps/design</td>
                <td className={`${tableCellVariants()} font-mono`}>HTML + React</td>
                <td className={tableCellVariants()}>Multi</td>
                <td className={tableCellVariants()}>
                  <span className={badgeVariants({ variant: "outline" })}>운영</span>
                </td>
              </tr>
              <tr className={tableRowVariants()}>
                <td className={`${tableCellVariants()} font-medium`}>apps/productivity</td>
                <td className={`${tableCellVariants()} font-mono`}>React</td>
                <td className={tableCellVariants()}>App</td>
                <td className={tableCellVariants()}>
                  <span className={badgeVariants({ variant: "secondary" })}>통합</span>
                </td>
              </tr>
              <tr className={tableRowVariants()}>
                <td className={`${tableCellVariants()} font-medium`}>apps/accounts</td>
                <td className={`${tableCellVariants()} font-mono`}>Angular</td>
                <td className={tableCellVariants()}>App</td>
                <td className={tableCellVariants()}>
                  <span className={badgeVariants({ variant: "muted" })}>SSO</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
    renderReactDemo: () => (
      <div className="border-border bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>서비스</TableHead>
              <TableHead>어댑터</TableHead>
              <TableHead>테마</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">apps/design</TableCell>
              <TableCell className="font-mono">HTML + React</TableCell>
              <TableCell>Multi</TableCell>
              <TableCell>
                <Badge variant="outline">운영</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">apps/productivity</TableCell>
              <TableCell className="font-mono">React</TableCell>
              <TableCell>App</TableCell>
              <TableCell>
                <Badge variant="secondary">통합</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">apps/accounts</TableCell>
              <TableCell className="font-mono">Angular</TableCell>
              <TableCell>App</TableCell>
              <TableCell>
                <Badge variant="muted">SSO</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    ),
  },
  {
    slug: "tabs",
    name: "Tabs",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/tabs",
    primitiveAngular: "@spartan-ng/brain/tabs",
    recipePath: "@goraebap/design-system/recipes/tabs",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "같은 맥락 안의 보기를 전환하는 탭입니다. 키보드 화살표 이동을 지원합니다.",
    pureHtmlNote:
      "Pure HTML <button role='tab'>로 외형은 구성할 수 있습니다. 좌우 화살표 키보드 이동(Roving Focus)과 aria-controls 연결은 Base UI나 Spartan Brain에서 처리합니다.",
    mobileGuideline: "탭 개수는 모바일 폭(390px)에서 잘리지 않게 2~4개 이내로 유지합니다.",
    htmlCode: `<div role="tablist" class="\${tabsListVariants()}">
  <button role="tab" aria-selected="true" data-selected class="\${tabsTriggerVariants()}">Tokens</button>
  <button role="tab" aria-selected="false" class="\${tabsTriggerVariants()}">Recipes</button>
</div>`,
    reactCode: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";

export function Example() {
  return (
    <Tabs defaultValue="react">
      <TabsList>
        <TabsTrigger value="react">React</TabsTrigger>
        <TabsTrigger value="angular">Angular</TabsTrigger>
      </TabsList>
      <TabsContent value="react">Base UI + CVA 레시피</TabsContent>
      <TabsContent value="angular">@spartan-ng/brain + 같은 CVA 레시피</TabsContent>
    </Tabs>
  );
}`,
    angularCode: `<brn-tabs defaultValue="angular">
  <brn-tabs-list [class]="tabsListVariants()">
    <button brnTabsTrigger="angular" [class]="tabsTriggerVariants()">Angular</button>
  </brn-tabs-list>
</brn-tabs>`,
    renderThumbnail: () => (
      <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1 text-[11px]">
        <span className="bg-background text-foreground rounded-md px-2 py-0.5 font-medium shadow-xs">
          HTML
        </span>
        <span className="text-muted-foreground px-2 py-0.5">React</span>
        <span className="text-muted-foreground px-2 py-0.5">Angular</span>
      </div>
    ),
    renderHtmlDemo: () => <NativeTabsDemo />,
    renderReactDemo: () => (
      <div className="border-border bg-card mx-auto max-w-md rounded-xl border p-5">
        <Tabs defaultValue="react">
          <TabsList>
            <TabsTrigger value="react">React</TabsTrigger>
            <TabsTrigger value="angular">Angular</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="react" className="text-muted-foreground text-xs leading-relaxed">
            React는 Base UI 프리미티브 위에{" "}
            <code className="font-mono">@goraebap/design-system</code> 레시피를 입힙니다.
          </TabsContent>
          <TabsContent value="angular" className="text-muted-foreground text-xs leading-relaxed">
            Angular는 <code className="font-mono">@spartan-ng/brain</code> 위에 완전히 같은 CVA
            레시피를 입힙니다.
          </TabsContent>
          <TabsContent value="tokens" className="text-muted-foreground text-xs leading-relaxed">
            색상·면 위계·반경은 순수 CSS 변수로 양쪽 프레임워크가 동일하게 공유합니다.
          </TabsContent>
        </Tabs>
      </div>
    ),
  },
  {
    slug: "dialog",
    name: "Dialog",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/dialog",
    primitiveAngular: "@spartan-ng/brain/dialog",
    recipePath: "@goraebap/design-system/recipes/dialog",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary:
      "짧은 확인이나 몇 칸짜리 입력을 띄우는 대화상자입니다. 모바일에서는 하단 바텀시트(surface='sheet')로 전환합니다.",
    pureHtmlNote:
      "네이티브 <dialog>.showModal()로 모달, ::backdrop, ESC 닫기를 구현할 수 있습니다. 중첩 오버레이 스택, 스크롤 잠금, 퇴장 애니메이션, 포커스 복원은 Base UI나 Spartan Brain에서 처리합니다.",
    mobileGuideline:
      "390px 모바일 폭에서는 중앙 모달 대신 하단 시트(surface='sheet')로 열어 한 손으로 닫고 조작할 수 있게 합니다.",
    htmlCode: `<button onclick="document.getElementById('demo-dlg').showModal()" class="\${buttonVariants()}">
  네이티브 &lt;dialog&gt; 열기
</button>
<dialog id="demo-dlg" class="\${dialogPopupVariants({ surface: 'dialog' })}">
  <h3 class="text-base font-semibold">네이티브 HTML 대화상자</h3>
  <button onclick="this.closest('dialog').close()">닫기</button>
</dialog>`,
    reactCode: `import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@goraebap/ui-react/components/dialog";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>대화상자 열기</DialogTrigger>
      <DialogContent surface="dialog">
        <DialogTitle>프로젝트 이름 바꾸기</DialogTitle>
        <DialogDescription>짧은 양식은 데스크톱 모달, 모바일 시트로 엽니다.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}`,
    angularCode: `<brn-dialog>
  <button brnDialogTrigger [class]="buttonVariants()">대화상자 열기</button>
  <ng-template brnDialogContent>
    <div [class]="dialogPopupVariants({ surface: 'dialog' })">...</div>
  </ng-template>
</brn-dialog>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-44 rounded-lg border p-2.5 text-left shadow-md">
        <div className="text-foreground text-[11px] font-medium">프로젝트 이름 바꾸기</div>
        <div className="bg-muted mt-1.5 h-4 w-full rounded" />
        <div className="mt-2 flex justify-end gap-1">
          <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[9px]">
            저장
          </span>
        </div>
      </div>
    ),
    renderHtmlDemo: ({ isMobile }) => <NativeDialogDemo isMobile={isMobile} />,
    renderReactDemo: ({ isMobile }) => <ReactDialogDemo isMobile={isMobile} />,
  },
  {
    slug: "toggle",
    name: "Toggle",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/toggle",
    primitiveAngular: "@spartan-ng/brain/toggle",
    recipePath: "@goraebap/design-system/recipes/toggle",
    pureHtmlLevel: "100% Native HTML",
    summary: "켜짐과 꺼짐 두 상태를 전환하는 토글 버튼입니다.",
    pureHtmlNote:
      "네이티브 <button aria-pressed>와 data-pressed 속성만으로 동작합니다. 제어·비제어 상태 관리는 헤드리스 프리미티브가 맡습니다.",
    mobileGuideline: "모바일에서는 최소 36px 이상의 터치 영역을 확보합니다.",
    htmlCode: `<button type="button" aria-pressed="true" data-pressed class="\${toggleVariants({ variant: 'outline' })}">
  고정됨
</button>`,
    reactCode: `import { Toggle } from "@goraebap/ui-react/components/toggle";

export function Example() {
  return <Toggle variant="outline" defaultPressed>고정됨</Toggle>;
}`,
    angularCode: `<button brnToggle [class]="toggleVariants({ variant: 'outline' })">고정됨</button>`,
    renderThumbnail: () => (
      <div className="flex items-center gap-1.5">
        <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-[11px] font-medium">
          고정됨
        </span>
        <span className="border-border text-muted-foreground rounded-md border px-2.5 py-1 text-[11px]">
          고정
        </span>
      </div>
    ),
    renderHtmlDemo: () => <NativeToggleDemo />,
    renderReactDemo: () => <ReactToggleDemo />,
  },
  {
    slug: "toggle-group",
    name: "Toggle Group",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/toggle-group",
    primitiveAngular: "@spartan-ng/brain/toggle-group",
    recipePath: "@goraebap/design-system/recipes/toggle-group",
    pureHtmlLevel: "Native HTML + CSS",
    summary: "여러 옵션 중 하나 또는 복수를 고르는 세그먼트 토글 그룹입니다.",
    pureHtmlNote:
      "버튼 묶음과 aria-pressed로 기본 동작을 만들 수 있습니다. 화살표 키 이동과 단일·다중 선택 상태 관리는 Base UI나 Spartan Brain이 처리합니다.",
    mobileGuideline: "항목이 3개 이하일 때 한 줄 세그먼트로 유지합니다.",
    htmlCode: `<div role="group" class="\${toggleGroupVariants({ shape: 'pill' })}">
  <button data-pressed class="\${toggleVariants({ shape: 'pill' })}">App</button>
  <button class="\${toggleVariants({ shape: 'pill' })}">Editorial</button>
</div>`,
    reactCode: `import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";

export function Example() {
  return (
    <ToggleGroup shape="pill" defaultValue={["app"]}>
      <ToggleGroupItem value="app" shape="pill">App</ToggleGroupItem>
      <ToggleGroupItem value="editorial" shape="pill">Editorial</ToggleGroupItem>
    </ToggleGroup>
  );
}`,
    angularCode: `<brn-toggle-group [class]="toggleGroupVariants({ shape: 'pill' })">
  <button brnToggle value="app" [class]="toggleVariants({ shape: 'pill' })">App</button>
</brn-toggle-group>`,
    renderThumbnail: () => (
      <div className="border-border bg-background inline-flex rounded-full border p-0.5 text-[11px]">
        <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 font-medium">
          App
        </span>
        <span className="text-muted-foreground px-2.5 py-0.5">Editorial</span>
      </div>
    ),
    renderHtmlDemo: () => <NativeToggleGroupDemo />,
    renderReactDemo: () => <ReactToggleGroupDemo />,
  },
  {
    slug: "select",
    name: "Select",
    category: "동작과 입력",
    primitiveReact: "@base-ui/react/select",
    primitiveAngular: "@spartan-ng/brain/select",
    recipePath: "@goraebap/design-system/recipes/select",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "미리 정해진 목록에서 하나의 값을 고르는 선택 컨트롤입니다.",
    pureHtmlNote:
      "네이티브 <select>는 드롭다운 메뉴 스타일을 자유롭게 꾸미기 어렵습니다. 커스텀 팝업, 체크 표시, 키보드 탐색은 Base UI나 Spartan Brain을 씁니다.",
    mobileGuideline: "선택지가 10개 이하일 때 Select를 쓰고, 검색이 필요하면 Combobox를 씁니다.",
    htmlCode: `<select class="\${selectTriggerVariants()}">
  <option value="app">App Theme</option>
  <option value="editorial">Editorial Theme</option>
</select>`,
    reactCode: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@goraebap/ui-react/components/select";

export function Example() {
  return (
    <Select defaultValue="app">
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="app">App Theme</SelectItem>
        <SelectItem value="editorial">Editorial Theme</SelectItem>
      </SelectContent>
    </Select>
  );
}`,
    angularCode: `<brn-select placeholder="테마 선택">
  <button brnSelectTrigger [class]="selectTriggerVariants()">...</button>
</brn-select>`,
    renderThumbnail: () => (
      <div className="border-input bg-background flex w-44 items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
        <span>App Theme</span>
        <span className="text-muted-foreground text-[10px]">▾</span>
      </div>
    ),
    renderHtmlDemo: () => <NativeSelectDemo />,
    renderReactDemo: () => <ReactSelectDemo />,
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/tooltip",
    primitiveAngular: "@spartan-ng/brain/tooltip",
    recipePath: "@goraebap/design-system/recipes/tooltip",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "아이콘 버튼이나 컨트롤에 마우스를 올렸을 때 짧은 보조 설명을 띄웁니다.",
    pureHtmlNote:
      "CSS hover만으로 기본 말풍선은 띄울 수 있지만, 화면 끝 충돌 회피·지연 시간·포커스 접근성은 헤드리스 프리미티브가 처리합니다.",
    mobileGuideline: "터치 환경에는 호버가 없으므로 필수 정보는 Tooltip 안에 숨기지 않습니다.",
    htmlCode: `<span role="tooltip" class="\${tooltipPopupVariants()}">단축키: Ctrl + K</span>`,
    reactCode: `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@goraebap/ui-react/components/tooltip";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" />}>도움말</TooltipTrigger>
        <TooltipContent>단축키: Ctrl + K</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}`,
    angularCode: `<brn-tooltip>
  <button brnTooltipTrigger>도움말</button>
  <span *brnTooltipContent [class]="tooltipPopupVariants()">단축키: Ctrl + K</span>
</brn-tooltip>`,
    renderThumbnail: () => (
      <div className="flex flex-col items-center gap-1.5">
        <span className="bg-foreground text-background rounded-md px-2 py-0.5 text-[10px]">
          Ctrl + K
        </span>
        <span className="border-border bg-background rounded-md border px-2.5 py-1 text-[11px]">
          도움말
        </span>
      </div>
    ),
    renderHtmlDemo: () => <NativeTooltipDemo />,
    renderReactDemo: () => <ReactTooltipDemo />,
  },
  {
    slug: "popover",
    name: "Popover",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/popover",
    primitiveAngular: "@spartan-ng/brain/popover",
    recipePath: "@goraebap/design-system/recipes/popover",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "트리거 요소 근처에 짧은 설정이나 보조 콘텐츠 패널을 띄웁니다.",
    pureHtmlNote:
      "HTML popover 속성으로 기본 토글은 가능하지만, 앵커 위치 계산·화면 경계 회피·포커스 복원은 Base UI나 Spartan Brain이 처리합니다.",
    mobileGuideline: "내용이 길어지면 Popover 대신 바텀시트 Dialog로 전환합니다.",
    htmlCode: `<div class="\${popoverPopupVariants()}">
  <h4 class="text-sm font-semibold">표시 범위</h4>
</div>`,
    reactCode: `import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@goraebap/ui-react/components/popover";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>필터 옵션</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>표시 범위</PopoverTitle>
        <PopoverDescription>트리거 근처에 보조 설정을 띄웁니다.</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}`,
    angularCode: `<brn-popover>
  <button brnPopoverTrigger>필터 옵션</button>
  <div *brnPopoverContent [class]="popoverPopupVariants()">...</div>
</brn-popover>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-40 rounded-lg border p-2.5 text-left shadow-sm">
        <div className="text-[11px] font-medium">표시 범위</div>
        <div className="text-muted-foreground mt-0.5 text-[10px]">필터 옵션 패널</div>
      </div>
    ),
    renderHtmlDemo: () => <NativePopoverDemo />,
    renderReactDemo: () => <ReactPopoverDemo />,
  },
  {
    slug: "menu",
    name: "Menu",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/menu",
    primitiveAngular: "@spartan-ng/brain/menu",
    recipePath: "@goraebap/design-system/recipes/menu",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "버튼을 눌러 실행 가능한 작업 목록을 펼치는 드롭다운 메뉴입니다.",
    pureHtmlNote:
      "화살표 키 탐색, 타이핑 검색, 바깥 클릭 닫기, 포커스 복원은 Base UI나 Spartan Brain을 통해 처리합니다.",
    mobileGuideline: "파괴적 동작(삭제 등)은 구분선 아래 마지막 항목에 둡니다.",
    htmlCode: `<div role="menu" class="\${menuPopupVariants()}">
  <button role="menuitem" class="\${menuItemVariants()}">복제</button>
  <button role="menuitem" class="\${menuItemVariants({ variant: 'destructive' })}">삭제</button>
</div>`,
    reactCode: `import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@goraebap/ui-react/components/menu";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" />}>작업 메뉴</MenuTrigger>
      <MenuContent>
        <MenuItem>복제</MenuItem>
        <MenuItem>이름 바꾸기</MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">삭제</MenuItem>
      </MenuContent>
    </Menu>
  );
}`,
    angularCode: `<button [brnMenuTriggerFor]="menu">작업 메뉴</button>
<ng-template #menu>
  <div brnMenu [class]="menuPopupVariants()">
    <button brnMenuItem [class]="menuItemVariants()">복제</button>
  </div>
</ng-template>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-36 space-y-0.5 rounded-lg border p-1.5 text-left text-[11px] shadow-sm">
        <div className="bg-accent rounded px-2 py-1">복제</div>
        <div className="text-muted-foreground px-2 py-1">이름 바꾸기</div>
        <div className="text-destructive px-2 py-1">삭제</div>
      </div>
    ),
    renderHtmlDemo: () => <NativeMenuDemo />,
    renderReactDemo: () => <ReactMenuDemo />,
  },
  {
    slug: "alert-dialog",
    name: "Alert Dialog",
    category: "오버레이와 탐색",
    primitiveReact: "@base-ui/react/alert-dialog",
    primitiveAngular: "@spartan-ng/brain/alert-dialog",
    recipePath: "@goraebap/design-system/recipes/alert-dialog",
    pureHtmlLevel: "Native HTML (한계 있음)",
    summary: "삭제·초기화처럼 되돌리기 어려운 동작 전 사용자의 명시적 확인을 받는 대화상자입니다.",
    pureHtmlNote:
      "일반 Dialog와 달리 바깥 클릭으로 실수로 닫히지 않아야 합니다. role='alertdialog'와 포커스 잠금은 Base UI나 Spartan Brain에서 처리합니다.",
    mobileGuideline: "취소와 파괴적 실행 버튼을 명확히 구분하고, 실행 버튼에 구체적 동사를 씁니다.",
    htmlCode: `<dialog class="\${alertDialogPopupVariants()}">
  <h3>프로젝트를 삭제할까요?</h3>
</dialog>`,
    reactCode: `import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@goraebap/ui-react/components/alert-dialog";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>프로젝트 삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>프로젝트를 삭제할까요?</AlertDialogTitle>
        <AlertDialogDescription>삭제한 프로젝트는 복구할 수 없습니다.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" size="sm" />}>취소</AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" size="sm" />}>삭제</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}`,
    angularCode: `<brn-alert-dialog>
  <button brnAlertDialogTrigger>프로젝트 삭제</button>
  <div *brnAlertDialogContent [class]="alertDialogPopupVariants()">...</div>
</brn-alert-dialog>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-44 rounded-lg border p-2.5 text-left shadow-sm">
        <div className="text-[11px] font-medium">프로젝트를 삭제할까요?</div>
        <div className="mt-2 flex justify-end gap-1">
          <span className="text-muted-foreground rounded px-1.5 py-0.5 text-[9px]">취소</span>
          <span className="bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 text-[9px]">
            삭제
          </span>
        </div>
      </div>
    ),
    renderHtmlDemo: () => <NativeAlertDialogDemo />,
    renderReactDemo: () => <ReactAlertDialogDemo />,
  },
];

export function getComponentDoc(slug: string): ComponentDocSpec | undefined {
  return COMPONENT_DOCS.find((item) => item.slug === slug);
}
