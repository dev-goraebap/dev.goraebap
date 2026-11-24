import type { ReactNode } from "react";
import { alertVariants } from "@goraebap/design-system/recipes/alert";
import { badgeVariants } from "@goraebap/design-system/recipes/badge";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { separatorVariants } from "@goraebap/design-system/recipes/separator";
import { skeletonVariants } from "@goraebap/design-system/recipes/skeleton";
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
  ReactAlertDialogDemo,
  ReactMenuDemo,
  ReactPopoverDemo,
  ReactSelectDemo,
  ReactToggleDemo,
  ReactToggleGroupDemo,
  ReactTooltipDemo,
} from "../ui/Batch1Demos";
import {
  ReactAccordionDemo,
  ReactAvatarDemo,
  ReactCollapsibleDemo,
  ReactDrawerDemo,
  ReactProgressDemo,
  ReactRadioGroupDemo,
  ReactSliderDemo,
  ReactToastDemo,
} from "../ui/Batch2Demos";
import {
  ReactAutocompleteDemo,
  ReactComboboxDemo,
  ReactContextMenuDemo,
  ReactMenubarDemo,
  ReactNavigationMenuDemo,
  ReactOTPFieldDemo,
  ReactPreviewCardDemo,
  ReactScrollAreaDemo,
} from "../ui/Batch3Demos";
import {
  ReactAvatarShapeDemo,
  ReactProgressShapeDemo,
  ReactSliderShapeDemo,
  ReactSwitchShapeDemo,
} from "../ui/ShapeDemos";
import {
  ReactBottomSheetDemo,
  ReactResponsiveDialogDemo,
  ReactResponsivePopoverDemo,
} from "../ui/BottomSheetDemos";
import { ReactCheckboxDemo, ReactDialogDemo, ReactSwitchDemo } from "../ui/InteractiveDemos";

export type ComponentCategory = "동작과 입력" | "표시와 구조" | "오버레이와 탐색";

interface ComponentExample {
  id: string;
  title: string;
  description?: string;
  reactCode: string;
  angularCode: string;
  renderReactDemo: () => ReactNode;
}

export interface ComponentDocSpec {
  slug: string;
  name: string;
  category: ComponentCategory;
  summary: string;
  reactCode: string;
  angularCode: string;
  renderThumbnail: () => ReactNode;
  renderReactDemo: () => ReactNode;
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
    summary: "동작을 실행하거나 링크로 이동하는 버튼입니다.",
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
    renderReactDemo: () => (
      <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
        <Button>저장</Button>
        <Button variant="secondary">임시 저장</Button>
        <Button variant="outline">미리보기</Button>
        <Button variant="ghost">취소</Button>
        <Button variant="destructive">삭제</Button>
      </div>
    ),
    examples: [
      {
        id: "pill",
        title: "Shape (Pill)",
        description:
          "랜딩 [[cta|CTA]], 헤더 액션, 필터 버튼처럼 둥근 형태가 필요할 때 shape='pill'을 씁니다.",
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
        renderReactDemo: () => (
          <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
            <Button shape="pill">시작하기</Button>
            <Button variant="secondary" shape="pill">
              컴포넌트 보기
            </Button>
            <Button variant="outline" shape="pill">
              문서 보기
            </Button>
          </div>
        ),
      },
      {
        id: "size",
        title: "Size",
        description: "툴바와 보조 동작은 sm, 일반 동작은 default, 모바일 주요 버튼은 lg를 씁니다.",
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
    summary:
      "한 줄 텍스트를 입력하는 칸입니다. invalid 상태로 오류 테두리와 aria-invalid를 함께 표시합니다.",
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
    summary: "여러 줄 설명이나 메모를 작성하는 입력 칸입니다.",
    reactCode: `import { Textarea } from "@goraebap/ui-react/components/textarea";

export function Example() {
  return <Textarea placeholder="변경 이유나 맥락을 적어 주세요." />;
}`,
    angularCode: `<textarea [class]="textareaVariants()" placeholder="변경 이유나 맥락을 적어 주세요."></textarea>`,
    renderThumbnail: () => (
      <div className="border-input bg-background text-muted-foreground h-14 w-48 rounded-md border p-2 text-[0.6875rem]">
        변경 이유를 적어 주세요...
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
    summary: "즉시 반영되는 켜짐/꺼짐 설정에 쓰는 토글 스위치입니다.",
    reactCode: `import { Switch } from "@goraebap/ui-react/components/switch";

export function Example() {
  return <Switch defaultChecked aria-label="이메일 알림 받기" />;
}`,
    angularCode: `<brn-switch [class]="switchTrackVariants()" [(checked)]="enabled">
  <brn-switch-thumb [class]="switchThumbVariants()" />
</brn-switch>`,
    examples: [
      {
        id: "shape",
        title: "Shape",
        reactCode: `<Switch shape="pill" aria-label="알림" />`,
        angularCode: `<button brnSwitch [class]="switchTrackVariants({ shape: 'pill' })"></button>`,
        renderReactDemo: () => <ReactSwitchShapeDemo />,
      },
    ],
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
    renderReactDemo: () => <ReactSwitchDemo />,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    category: "동작과 입력",
    summary: "여러 항목을 고르거나 동의 여부를 확인하는 체크박스입니다.",
    reactCode: `import { Checkbox } from "@goraebap/ui-react/components/checkbox";

export function Example() {
  return <Checkbox defaultChecked aria-label="세션 유지" />;
}`,
    angularCode: `<brn-checkbox [class]="checkboxVariants()" [(checked)]="keepSession" />`,
    renderThumbnail: () => (
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-primary text-primary-foreground inline-flex size-4 items-center justify-center rounded text-[0.625rem]">
          ✓
        </span>
        <span className="text-foreground">세션 유지</span>
      </div>
    ),
    renderReactDemo: () => <ReactCheckboxDemo />,
  },
  {
    slug: "badge",
    name: "Badge",
    category: "표시와 구조",
    summary: "상태, 역할, 분류처럼 짧은 메타데이터를 표시합니다.",
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
    summary: "페이지 면(--background) 위에 한 단계 올라오는 올린 면(--card) 컨테이너입니다.",
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
        <div className="text-muted-foreground mt-0.5 text-[0.625rem]">활성 2개 · MCP</div>
      </div>
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
    summary: "중요한 안내, 성공, 경고, 오류 메시지를 문맥 안에 인라인으로 알립니다.",
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
        <div className="text-[0.6875rem] font-medium">서브도메인 SSO</div>
        <div className="text-[0.625rem] opacity-80">세션 공유 활성화됨</div>
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
    summary: "영역이나 항목 사이를 --border 1px 선으로 나눕니다.",
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
    examples: [
      {
        id: "wave",
        title: "Wave Divider",
        description: "블로그나 문서 본문에서 섹션을 부드럽게 나눌 때 variant='wave'를 씁니다.",
        reactCode: `import { Separator } from "@goraebap/ui-react/components/separator";

export function WaveDividerExample() {
  return <Separator variant="wave" />;
}`,
        angularCode: `<div role="separator" class="text-border flex w-full justify-center py-2">...</div>`,
        renderReactDemo: () => (
          <div className="border-border bg-card mx-auto max-w-sm space-y-3 rounded-xl border p-5 text-xs">
            <p className="text-muted-foreground">첫 번째 섹션 본문입니다.</p>
            <Separator variant="wave" />
            <p className="text-muted-foreground">두 번째 섹션 본문입니다.</p>
          </div>
        ),
      },
    ],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    category: "표시와 구조",
    summary: "데이터를 불러오는 동안 콘텐츠가 들어갈 자리를 미리 표시합니다.",
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
    summary: "여러 항목의 속성을 같은 열 기준으로 비교하는 표입니다.",
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
          <TableCell>React + Angular</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}`,
    angularCode: `<table [class]="tableVariants()">...</table>`,
    renderThumbnail: () => (
      <div className="border-border bg-card w-44 overflow-hidden rounded-md border text-[0.625rem]">
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
    summary: "같은 맥락 안의 보기를 전환하는 탭입니다. 키보드 화살표 이동을 지원합니다.",
    reactCode: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";

export function Example() {
  return (
    <Tabs defaultValue="react">
      <TabsList>
        <TabsTrigger value="react">React</TabsTrigger>
        <TabsTrigger value="angular">Angular</TabsTrigger>
      </TabsList>
      <TabsContent value="react">Base UI + 스타일 레시피</TabsContent>
      <TabsContent value="angular">@spartan-ng/brain + 같은 스타일 레시피</TabsContent>
    </Tabs>
  );
}`,
    angularCode: `<brn-tabs defaultValue="angular">
  <brn-tabs-list [class]="tabsListVariants()">
    <button brnTabsTrigger="angular" [class]="tabsTriggerVariants()">Angular</button>
  </brn-tabs-list>
</brn-tabs>`,
    renderThumbnail: () => (
      <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1 text-[0.6875rem]">
        <span className="bg-background text-foreground rounded-md px-2 py-0.5 font-medium shadow-xs">
          HTML
        </span>
        <span className="text-muted-foreground px-2 py-0.5">React</span>
        <span className="text-muted-foreground px-2 py-0.5">Angular</span>
      </div>
    ),
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
            Angular는 <code className="font-mono">@spartan-ng/brain</code> 위에 완전히 같은 스타일
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
    summary: "현재 화면을 유지한 채 짧은 확인이나 몇 칸짜리 입력을 받는 대화상자입니다.",
    reactCode: `import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@goraebap/ui-react/components/dialog";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>대화상자 열기</DialogTrigger>
      <DialogContent>
        <DialogTitle>프로젝트 이름 바꾸기</DialogTitle>
        <DialogDescription>새 이름을 입력합니다.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}`,
    angularCode: `<brn-dialog>
  <button brnDialogTrigger [class]="buttonVariants()">대화상자 열기</button>
  <ng-template brnDialogContent>
    <div [class]="dialogPopupVariants()">...</div>
  </ng-template>
</brn-dialog>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-44 rounded-lg border p-2.5 text-left shadow-md">
        <div className="text-foreground text-[0.6875rem] font-medium">프로젝트 이름 바꾸기</div>
        <div className="bg-muted mt-1.5 h-4 w-full rounded" />
        <div className="mt-2 flex justify-end gap-1">
          <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[0.5625rem]">
            저장
          </span>
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactDialogDemo />,
    examples: [
      {
        id: "responsive",
        title: "Responsive",
        description:
          "넓은 화면에서는 중앙 [[modal|모달]], 좁은 화면에서는 [[bottom-sheet|바텀시트]]로 자동 전환합니다.",
        reactCode: `<ResponsiveDialog>
  <ResponsiveDialogTrigger render={<Button variant="outline" />}>필터 설정</ResponsiveDialogTrigger>
  <ResponsiveDialogContent>
    <ResponsiveDialogTitle>필터 설정</ResponsiveDialogTitle>
    <ResponsiveDialogDescription>조건을 고릅니다.</ResponsiveDialogDescription>
  </ResponsiveDialogContent>
</ResponsiveDialog>`,
        angularCode: `@if (isMobile()) {
  <brn-sheet side="bottom">...</brn-sheet>
} @else {
  <brn-dialog>...</brn-dialog>
}`,
        renderReactDemo: () => <ReactResponsiveDialogDemo />,
      },
    ],
  },
  {
    slug: "toggle",
    name: "Toggle",
    category: "동작과 입력",
    summary: "켜짐과 꺼짐 두 상태를 전환하는 토글 버튼입니다.",
    reactCode: `import { Toggle } from "@goraebap/ui-react/components/toggle";

export function Example() {
  return <Toggle variant="outline" defaultPressed>고정됨</Toggle>;
}`,
    angularCode: `<button brnToggle [class]="toggleVariants({ variant: 'outline' })">고정됨</button>`,
    renderThumbnail: () => (
      <div className="flex items-center gap-1.5">
        <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-[0.6875rem] font-medium">
          고정됨
        </span>
        <span className="border-border text-muted-foreground rounded-md border px-2.5 py-1 text-[0.6875rem]">
          고정
        </span>
      </div>
    ),
    renderReactDemo: () => <ReactToggleDemo />,
  },
  {
    slug: "toggle-group",
    name: "Toggle Group",
    category: "동작과 입력",
    summary: "여러 옵션 중 하나 또는 복수를 고르는 세그먼트 토글 그룹입니다.",
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
      <div className="border-border bg-background inline-flex rounded-full border p-0.5 text-[0.6875rem]">
        <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 font-medium">
          App
        </span>
        <span className="text-muted-foreground px-2.5 py-0.5">Editorial</span>
      </div>
    ),
    renderReactDemo: () => <ReactToggleGroupDemo />,
  },
  {
    slug: "select",
    name: "Select",
    category: "동작과 입력",
    summary: "미리 정해진 목록에서 하나의 값을 고르는 선택 컨트롤입니다.",
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
        <span className="text-muted-foreground text-[0.625rem]">▾</span>
      </div>
    ),
    renderReactDemo: () => <ReactSelectDemo />,
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "오버레이와 탐색",
    summary: "아이콘 버튼이나 컨트롤에 마우스를 올렸을 때 짧은 보조 설명을 띄웁니다.",
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
        <span className="bg-foreground text-background rounded-md px-2 py-0.5 text-[0.625rem]">
          Ctrl + K
        </span>
        <span className="border-border bg-background rounded-md border px-2.5 py-1 text-[0.6875rem]">
          도움말
        </span>
      </div>
    ),
    renderReactDemo: () => <ReactTooltipDemo />,
  },
  {
    slug: "popover",
    name: "Popover",
    category: "오버레이와 탐색",
    summary: "트리거 요소 근처에 짧은 설정이나 보조 콘텐츠 패널을 띄웁니다.",
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
        <div className="text-[0.6875rem] font-medium">표시 범위</div>
        <div className="text-muted-foreground mt-0.5 text-[0.625rem]">필터 옵션 패널</div>
      </div>
    ),
    renderReactDemo: () => <ReactPopoverDemo />,
    examples: [
      {
        id: "responsive",
        title: "Responsive",
        description: "넓은 화면에서는 팝오버, 좁은 화면에서는 바텀시트로 자동 전환합니다.",
        reactCode: `<ResponsivePopover>
  <ResponsivePopoverTrigger render={<Button variant="outline" />}>표시 옵션</ResponsivePopoverTrigger>
  <ResponsivePopoverContent>
    <ResponsivePopoverTitle>표시 옵션</ResponsivePopoverTitle>
  </ResponsivePopoverContent>
</ResponsivePopover>`,
        angularCode: `@if (isMobile()) {
  <brn-sheet side="bottom">...</brn-sheet>
} @else {
  <brn-popover>...</brn-popover>
}`,
        renderReactDemo: () => <ReactResponsivePopoverDemo />,
      },
    ],
  },
  {
    slug: "menu",
    name: "Menu",
    category: "오버레이와 탐색",
    summary: "버튼을 눌러 실행 가능한 작업 목록을 펼치는 드롭다운 메뉴입니다.",
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
      <div className="border-border bg-popover w-36 space-y-0.5 rounded-lg border p-1.5 text-left text-[0.6875rem] shadow-sm">
        <div className="bg-accent rounded px-2 py-1">복제</div>
        <div className="text-muted-foreground px-2 py-1">이름 바꾸기</div>
        <div className="text-destructive px-2 py-1">삭제</div>
      </div>
    ),
    renderReactDemo: () => <ReactMenuDemo />,
  },
  {
    slug: "alert-dialog",
    name: "Alert Dialog",
    category: "오버레이와 탐색",
    summary: "삭제·초기화처럼 되돌리기 어려운 동작 전 사용자의 명시적 확인을 받는 대화상자입니다.",
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
        <div className="text-[0.6875rem] font-medium">프로젝트를 삭제할까요?</div>
        <div className="mt-2 flex justify-end gap-1">
          <span className="text-muted-foreground rounded px-1.5 py-0.5 text-[0.5625rem]">취소</span>
          <span className="bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 text-[0.5625rem]">
            삭제
          </span>
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactAlertDialogDemo />,
  },
  {
    slug: "radio-group",
    name: "Radio Group",
    category: "동작과 입력",
    summary: "서로 배타적인 여러 선택지 중 하나를 고르는 라디오 그룹입니다.",
    reactCode: `import { RadioGroup, RadioGroupItem } from "@goraebap/ui-react/components/radio-group";

export function Example() {
  return (
    <RadioGroup defaultValue="app">
      <label className="flex items-center gap-2"><RadioGroupItem value="app" />App Theme</label>
      <label className="flex items-center gap-2"><RadioGroupItem value="editorial" />Editorial Theme</label>
    </RadioGroup>
  );
}`,
    angularCode: `<brn-radio-group [class]="radioGroupVariants()">
  <brn-radio value="app" [class]="radioItemVariants()">App Theme</brn-radio>
</brn-radio-group>`,
    renderThumbnail: () => (
      <div className="space-y-1.5 text-left text-xs">
        <div className="flex items-center gap-2">
          <span className="border-primary flex size-3.5 items-center justify-center rounded-full border">
            <span className="bg-primary size-1.5 rounded-full" />
          </span>
          <span>App</span>
        </div>
        <div className="text-muted-foreground flex items-center gap-2">
          <span className="border-input size-3.5 rounded-full border" />
          <span>Editorial</span>
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactRadioGroupDemo />,
  },
  {
    slug: "slider",
    name: "Slider",
    category: "동작과 입력",
    summary: "정해진 범위 안에서 연속된 값을 드래그로 조절하는 슬라이더입니다.",
    reactCode: `import { Slider } from "@goraebap/ui-react/components/slider";

export function Example() {
  return <Slider defaultValue={60} aria-label="불투명도" />;
}`,
    angularCode: `<brn-slider [value]="60" />`,
    examples: [
      {
        id: "shape",
        title: "Shape",
        reactCode: `<Slider shape="pill" defaultValue={60} aria-label="불투명도" />`,
        angularCode: `<brn-slider [class]="sliderTrackVariants({ shape: 'pill' })" />`,
        renderReactDemo: () => <ReactSliderShapeDemo />,
      },
    ],
    renderThumbnail: () => (
      <div className="flex w-40 items-center">
        <div className="bg-secondary relative h-1.5 w-full rounded-full">
          <div className="bg-primary h-full w-3/5 rounded-full" />
          <div className="border-primary bg-background absolute top-1/2 left-3/5 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactSliderDemo />,
  },
  {
    slug: "accordion",
    name: "Accordion",
    category: "표시와 구조",
    summary: "여러 항목을 접고 펼치며 긴 정보를 단계적으로 보여 주는 아코디언입니다.",
    reactCode: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@goraebap/ui-react/components/accordion";

export function Example() {
  return (
    <Accordion defaultValue={["tokens"]}>
      <AccordionItem value="tokens">
        <AccordionTrigger>토큰은 어떻게 적용하나요?</AccordionTrigger>
        <AccordionContent>base.css와 테마 CSS를 불러옵니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`,
    angularCode: `<div brnAccordion>
  <div brnAccordionItem [class]="accordionItemVariants()">...</div>
</div>`,
    renderThumbnail: () => (
      <div className="border-border bg-card w-44 divide-y rounded-lg border px-2.5 text-left text-[0.625rem]">
        <div className="flex items-center justify-between py-1.5 font-medium">
          <span>토큰 적용</span>
          <span>▾</span>
        </div>
        <div className="text-muted-foreground flex items-center justify-between py-1.5">
          <span>아이콘 설정</span>
          <span>▸</span>
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactAccordionDemo />,
  },
  {
    slug: "collapsible",
    name: "Collapsible",
    category: "표시와 구조",
    summary: "단일 보조 영역을 필요할 때만 펼치거나 접는 컨테이너입니다.",
    reactCode: `import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@goraebap/ui-react/components/collapsible";

export function Example() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>고급 설정 보기</CollapsibleTrigger>
      <CollapsibleContent>보조 설정 내용</CollapsibleContent>
    </Collapsible>
  );
}`,
    angularCode: `<brn-collapsible>
  <button brnCollapsibleTrigger>고급 설정 보기</button>
  <brn-collapsible-content>보조 설정 내용</brn-collapsible-content>
</brn-collapsible>`,
    renderThumbnail: () => (
      <div className="border-border bg-card w-40 rounded-lg border p-2 text-left text-[0.625rem]">
        <div className="font-medium">고급 설정 ▾</div>
        <div className="text-muted-foreground mt-1">캐시 · 재시도 정책</div>
      </div>
    ),
    renderReactDemo: () => <ReactCollapsibleDemo />,
  },
  {
    slug: "avatar",
    name: "Avatar",
    category: "표시와 구조",
    summary: "사용자 프로필 이미지와 이미지 로드 실패 시 이니셜 대체 표시를 제공합니다.",
    reactCode: `import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";

export function Example() {
  return (
    <Avatar>
      <AvatarFallback>고래</AvatarFallback>
    </Avatar>
  );
}`,
    angularCode: `<brn-avatar [class]="avatarVariants()">
  <span brnAvatarFallback [class]="avatarFallbackVariants()">고래</span>
</brn-avatar>`,
    examples: [
      {
        id: "shape",
        title: "Shape",
        reactCode: `<Avatar shape="pill">...</Avatar>`,
        angularCode: `<span [class]="avatarVariants({ shape: 'pill' })">...</span>`,
        renderReactDemo: () => <ReactAvatarShapeDemo />,
      },
    ],
    renderThumbnail: () => (
      <div className="flex items-center gap-2">
        <span className="border-border bg-secondary flex size-7 items-center justify-center rounded-full border text-[0.625rem] font-medium">
          GB
        </span>
        <span className="border-border bg-secondary flex size-9 items-center justify-center rounded-full border text-xs font-medium">
          고래
        </span>
      </div>
    ),
    renderReactDemo: () => <ReactAvatarDemo />,
  },
  {
    slug: "progress",
    name: "Progress",
    category: "표시와 구조",
    summary: "작업 완료율이나 업로드 진행 상태를 막대로 표시합니다.",
    reactCode: `import { Progress } from "@goraebap/ui-react/components/progress";

export function Example() {
  return <Progress value={68} />;
}`,
    angularCode: `<brn-progress [value]="68" [class]="progressTrackVariants()">
  <brn-progress-indicator [class]="progressIndicatorVariants()" />
</brn-progress>`,
    examples: [
      {
        id: "shape",
        title: "Shape",
        reactCode: `<Progress shape="pill" value={68} />`,
        angularCode: `<brn-progress [class]="progressTrackVariants({ shape: 'pill' })" />`,
        renderReactDemo: () => <ReactProgressShapeDemo />,
      },
    ],
    renderThumbnail: () => (
      <div className="w-40 space-y-1.5">
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div className="bg-primary h-full w-2/3 rounded-full" />
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactProgressDemo />,
  },
  {
    slug: "drawer",
    name: "Drawer",
    category: "오버레이와 탐색",
    summary: "화면 좌우에서 슬라이드되어 보조 탐색이나 필터 패널을 엽니다.",
    reactCode: `import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@goraebap/ui-react/components/drawer";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" size="sm" />}>드로어 열기</DrawerTrigger>
      <DrawerContent side="right">
        <DrawerTitle>필터 설정</DrawerTitle>
        <DrawerDescription>화면 가장자리에서 보조 패널을 엽니다.</DrawerDescription>
      </DrawerContent>
    </Drawer>
  );
}`,
    angularCode: `<brn-sheet side="right">
  <button brnSheetTrigger>드로어 열기</button>
  <div *brnSheetContent [class]="drawerPopupVariants({ side: 'right' })">...</div>
</brn-sheet>`,
    renderThumbnail: () => (
      <div className="border-border bg-background relative h-20 w-40 overflow-hidden rounded-lg border">
        <div className="border-border bg-popover absolute inset-y-0 right-0 w-16 border-l p-2 shadow-sm">
          <div className="bg-foreground/20 h-1.5 w-8 rounded" />
          <div className="bg-muted mt-1.5 h-1.5 w-10 rounded" />
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactDrawerDemo />,
  },
  {
    slug: "bottom-sheet",
    name: "Bottom Sheet",
    category: "오버레이와 탐색",
    summary: "화면 아래에서 올라와 한 손으로 조작하고 아래로 끌어내려 닫는 패널입니다.",
    reactCode: `import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@goraebap/ui-react/components/bottom-sheet";
import { Button } from "@goraebap/ui-react/components/button";

export function Example() {
  return (
    <BottomSheet>
      <BottomSheetTrigger render={<Button />}>바텀시트 열기</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>필터 설정</BottomSheetTitle>
        <BottomSheetDescription>아래로 끌어내리거나 바깥을 눌러 닫습니다.</BottomSheetDescription>
        <BottomSheetFooter>
          <BottomSheetClose render={<Button variant="ghost" />}>취소</BottomSheetClose>
          <BottomSheetClose render={<Button />}>적용</BottomSheetClose>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}`,
    angularCode: `<brn-sheet side="bottom">
  <button brnSheetTrigger [class]="buttonVariants()">바텀시트 열기</button>
  <div *brnSheetContent [class]="bottomSheetPopupVariants()">
    <div [class]="bottomSheetHandleVariants()"></div>
    <div [class]="bottomSheetContentVariants()">...</div>
  </div>
</brn-sheet>`,
    renderThumbnail: () => (
      <div className="border-border bg-background relative h-24 w-20 overflow-hidden rounded-lg border">
        <div className="border-border bg-popover absolute inset-x-0 bottom-0 rounded-t-lg border-t p-1.5 shadow-md">
          <div className="bg-border mx-auto mb-1.5 h-0.5 w-5 rounded-full" />
          <div className="bg-foreground/20 h-1.5 w-8 rounded" />
          <div className="bg-muted mt-1 h-1.5 w-full rounded" />
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactBottomSheetDemo />,
  },
  {
    slug: "toast",
    name: "Toast",
    category: "오버레이와 탐색",
    summary: "저장 완료나 복사 같은 짧은 처리 결과를 화면 모서리에 잠시 알립니다.",
    reactCode: `import { ToastProvider, useToastManager } from "@goraebap/ui-react/components/toast";

// 앱 루트에 <ToastProvider>를 두고, 내부에서 useToastManager().add(...) 호출`,
    angularCode: `import { toast } from "ngx-sonner";
toast("설정이 저장되었습니다");`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-44 rounded-lg border p-2.5 text-left shadow-sm">
        <div className="text-[0.6875rem] font-medium">설정이 저장되었습니다</div>
        <div className="text-muted-foreground text-[0.5625rem]">변경 사항이 즉시 반영됩니다.</div>
      </div>
    ),
    renderReactDemo: () => <ReactToastDemo />,
  },
  {
    slug: "combobox",
    name: "Combobox",
    category: "동작과 입력",
    summary: "텍스트 입력으로 후보 목록을 실시간 필터링하고 값을 고르는 콤보박스입니다.",
    reactCode: `import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@goraebap/ui-react/components/combobox";`,
    angularCode: `<brn-combobox>...</brn-combobox>`,
    renderThumbnail: () => (
      <div className="border-input bg-background flex w-44 items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
        <span className="text-muted-foreground">검색...</span>
        <span className="text-muted-foreground text-[0.625rem]">▾</span>
      </div>
    ),
    renderReactDemo: () => <ReactComboboxDemo />,
  },
  {
    slug: "autocomplete",
    name: "Autocomplete",
    category: "동작과 입력",
    summary: "자유 입력을 허용하면서 추천 검색어나 후보를 제안하는 자동완성 입력 칸입니다.",
    reactCode: `import { Autocomplete, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompleteList } from "@goraebap/ui-react/components/autocomplete";`,
    angularCode: `<brn-autocomplete>...</brn-autocomplete>`,
    renderThumbnail: () => (
      <div className="w-44 space-y-1 text-left">
        <div className="border-input bg-background rounded-md border px-2.5 py-1 text-[0.6875rem]">
          Rea|
        </div>
        <div className="border-border bg-popover rounded-md border px-2 py-1 text-[0.625rem]">
          React
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactAutocompleteDemo />,
  },
  {
    slug: "otp-field",
    name: "OTP Field",
    category: "동작과 입력",
    summary: "이메일·문자 인증번호처럼 고정 길이 코드를 한 자리씩 입력하는 칸입니다.",
    reactCode: `import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@goraebap/ui-react/components/otp-field";

export function Example() {
  return (
    <OTPField length={6}>
      <OTPFieldInput /><OTPFieldInput /><OTPFieldInput />
      <OTPFieldSeparator />
      <OTPFieldInput /><OTPFieldInput /><OTPFieldInput />
    </OTPField>
  );
}`,
    angularCode: `<brn-input-otp [maxLength]="6">...</brn-input-otp>`,
    renderThumbnail: () => (
      <div className="flex items-center gap-1 font-mono text-xs">
        {["4", "8", "2", "1"].map((n, i) => (
          <span
            key={i}
            className="border-input bg-background flex size-7 items-center justify-center rounded border"
          >
            {n}
          </span>
        ))}
      </div>
    ),
    renderReactDemo: () => <ReactOTPFieldDemo />,
  },
  {
    slug: "scroll-area",
    name: "Scroll Area",
    category: "표시와 구조",
    summary: "고정 높이 영역 안에서 일관된 커스텀 스크롤바를 제공하는 스크롤 컨테이너입니다.",
    reactCode: `import { ScrollArea } from "@goraebap/ui-react/components/scroll-area";

export function Example() {
  return <ScrollArea className="h-40">...</ScrollArea>;
}`,
    angularCode: `<ng-scrollbar [class]="scrollAreaRootVariants()">...</ng-scrollbar>`,
    renderThumbnail: () => (
      <div className="border-border bg-card relative h-16 w-40 rounded-lg border p-2 text-left text-[0.625rem]">
        <div className="space-y-1">
          <div className="bg-muted h-2 w-24 rounded" />
          <div className="bg-muted h-2 w-20 rounded" />
          <div className="bg-muted h-2 w-28 rounded" />
        </div>
        <div className="bg-border absolute top-2 right-1.5 h-8 w-1 rounded-full" />
      </div>
    ),
    renderReactDemo: () => <ReactScrollAreaDemo />,
  },
  {
    slug: "context-menu",
    name: "Context Menu",
    category: "오버레이와 탐색",
    summary: "대상 영역을 우클릭했을 때 포인터 위치에 열리는 컨텍스트 메뉴입니다.",
    reactCode: `import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@goraebap/ui-react/components/context-menu";`,
    angularCode: `<div [brnContextMenuTriggerFor]="menu">우클릭 영역</div>`,
    renderThumbnail: () => (
      <div className="border-border bg-card text-muted-foreground flex h-16 w-40 items-center justify-center rounded-lg border border-dashed text-[0.625rem]">
        우클릭 메뉴
      </div>
    ),
    renderReactDemo: () => <ReactContextMenuDemo />,
  },
  {
    slug: "preview-card",
    name: "Preview Card",
    category: "오버레이와 탐색",
    summary: "링크나 사용자 이름에 마우스를 올렸을 때 요약 정보를 미리 보여 주는 호버 카드입니다.",
    reactCode: `import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "@goraebap/ui-react/components/preview-card";`,
    angularCode: `<brn-hover-card>
  <a brnHoverCardTrigger>@goraebap/design-system</a>
  <div *brnHoverCardContent [class]="previewCardPopupVariants()">...</div>
</brn-hover-card>`,
    renderThumbnail: () => (
      <div className="border-border bg-popover w-40 rounded-lg border p-2.5 text-left shadow-sm">
        <div className="text-[0.625rem] font-semibold">@goraebap/design-system</div>
        <div className="text-muted-foreground mt-0.5 text-[0.5625rem]">
          CSS 토큰 · 스타일 레시피
        </div>
      </div>
    ),
    renderReactDemo: () => <ReactPreviewCardDemo />,
  },
  {
    slug: "menubar",
    name: "Menubar",
    category: "오버레이와 탐색",
    summary: "파일·편집·보기처럼 상단 메뉴 항목을 가로로 묶어 탐색하는 데스크톱 메뉴바입니다.",
    reactCode: `import { Menubar, menubarTriggerVariants } from "@goraebap/ui-react/components/menubar";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@goraebap/ui-react/components/menu";`,
    angularCode: `<div brnMenuBar [class]="menubarVariants()">...</div>`,
    renderThumbnail: () => (
      <div className="border-border bg-card inline-flex gap-1 rounded-lg border p-1 text-[0.625rem]">
        <span className="bg-accent rounded px-2 py-0.5 font-medium">파일</span>
        <span className="text-muted-foreground px-2 py-0.5">편집</span>
        <span className="text-muted-foreground px-2 py-0.5">보기</span>
      </div>
    ),
    renderReactDemo: () => <ReactMenubarDemo />,
  },
  {
    slug: "navigation-menu",
    name: "Navigation Menu",
    category: "오버레이와 탐색",
    summary: "사이트 상단에서 하위 링크 패널을 부드럽게 전환하는 내비게이션 메뉴입니다.",
    reactCode: `import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from "@goraebap/ui-react/components/navigation-menu";`,
    angularCode: `<nav brnNavigationMenu>...</nav>`,
    renderThumbnail: () => (
      <div className="border-border bg-card inline-flex gap-1.5 rounded-lg border px-2 py-1 text-[0.625rem]">
        <span className="font-medium">파운데이션 ▾</span>
        <span className="text-muted-foreground">컴포넌트</span>
      </div>
    ),
    renderReactDemo: () => <ReactNavigationMenuDemo />,
  },
];

export function getComponentDoc(slug: string): ComponentDocSpec | undefined {
  return COMPONENT_DOCS.find((item) => item.slug === slug);
}
