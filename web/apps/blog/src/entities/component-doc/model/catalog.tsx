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

// 컴포넌트 문서(content/design-system/components)가 그리는 견본. 글과 코드는 문서에 있고, 여기에는 그림만 둔다.
interface ComponentExampleDemo {
  id: string;
  renderReactDemo: () => ReactNode;
}

export interface ComponentDemoSpec {
  slug: string;
  renderThumbnail: () => ReactNode;
  renderReactDemo: () => ReactNode;
  examples?: ComponentExampleDemo[];
}

export const COMPONENT_DEMOS: ComponentDemoSpec[] = [
  {
    slug: "button",
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
    examples: [
      {
        id: "shape",
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
          <span>sso</span>
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
              <TableCell className="font-medium">apps/blog</TableCell>
              <TableCell className="font-mono">HTML + React</TableCell>
              <TableCell>Multi</TableCell>
              <TableCell>
                <Badge variant="outline">운영</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">apps/sso</TableCell>
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
        renderReactDemo: () => <ReactResponsiveDialogDemo />,
      },
    ],
  },
  {
    slug: "toggle",
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
        renderReactDemo: () => <ReactResponsivePopoverDemo />,
      },
    ],
  },
  {
    slug: "menu",
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
    examples: [
      {
        id: "shape",
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
    examples: [
      {
        id: "shape",
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
    examples: [
      {
        id: "shape",
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
    renderThumbnail: () => (
      <div className="border-border bg-card text-muted-foreground flex h-16 w-40 items-center justify-center rounded-lg border border-dashed text-[0.625rem]">
        우클릭 메뉴
      </div>
    ),
    renderReactDemo: () => <ReactContextMenuDemo />,
  },
  {
    slug: "preview-card",
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
    renderThumbnail: () => (
      <div className="border-border bg-card inline-flex gap-1.5 rounded-lg border px-2 py-1 text-[0.625rem]">
        <span className="font-medium">파운데이션 ▾</span>
        <span className="text-muted-foreground">컴포넌트</span>
      </div>
    ),
    renderReactDemo: () => <ReactNavigationMenuDemo />,
  },
];

export function getComponentDemo(slug: string): ComponentDemoSpec | undefined {
  return COMPONENT_DEMOS.find((item) => item.slug === slug);
}
