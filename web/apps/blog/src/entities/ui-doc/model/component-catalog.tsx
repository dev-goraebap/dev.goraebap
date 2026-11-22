import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui/components/alert";
import { Badge } from "@goraebap/ui/components/badge";
import { Button } from "@goraebap/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@goraebap/ui/components/card";
import { Input } from "@goraebap/ui/components/input";
import { Separator } from "@goraebap/ui/components/separator";
import { Skeleton } from "@goraebap/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui/components/tabs";
import { Textarea } from "@goraebap/ui/components/textarea";
import {
  InteractiveCheckboxDemo,
  InteractiveDialogDemo,
  InteractiveSwitchDemo,
} from "../ui/InteractiveDemos";

interface ComponentDocSpec {
  slug: string;
  name: string;
  group: "입력 · 동작" | "표시 · 구조" | "오버레이 · 탐색";
  primitive: string;
  recipePath: string;
  summary: string;
  mobileGuideline: string;
  code: string;
  renderDemo: (ctx: { isMobile: boolean }) => ReactNode;
}

export const COMPONENT_DOCS: ComponentDocSpec[] = [
  {
    slug: "button",
    name: "Button",
    group: "입력 · 동작",
    primitive: "@base-ui/react/button",
    recipePath: "@goraebap/design-system/recipes/button",
    summary:
      "행동을 실행하거나 링크로 이동하는 기본 버튼입니다. render prop으로 라우터 링크와 합성합니다.",
    mobileGuideline:
      "모바일에서는 터치 오작동을 줄이기 위해 주요 동작 버튼을 전체 폭(w-full) 또는 h-10 이상으로 배치합니다.",
    code: `import { Button } from "@goraebap/ui/components/button";

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
    renderDemo: ({ isMobile }) => (
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
  },
  {
    slug: "input",
    name: "Input",
    group: "입력 · 동작",
    primitive: "HTML <input>",
    recipePath: "@goraebap/design-system/recipes/input",
    summary:
      "한 줄 텍스트 입력 칸입니다. invalid 상태로 오류 테두리와 aria-invalid를 함께 표현합니다.",
    mobileGuideline:
      "모바일 사파리 자동 확대를 막고 터치하기 편하도록 14px~16px 글자와 넉넉한 높이를 유지합니다.",
    code: `import { Input } from "@goraebap/ui/components/input";

export function Example() {
  return (
    <div className="space-y-3">
      <Input placeholder="name@goraebap.xyz" />
      <Input invalid defaultValue="invalid-email" />
    </div>
  );
}`,
    renderDemo: () => (
      <div className="mx-auto max-w-sm space-y-3">
        <Input placeholder="name@goraebap.xyz" />
        <Input invalid defaultValue="잘못된 이메일 형식" />
        <Input disabled value="비활성화된 입력 칸" />
      </div>
    ),
  },
  {
    slug: "textarea",
    name: "Textarea",
    group: "입력 · 동작",
    primitive: "HTML <textarea>",
    recipePath: "@goraebap/design-system/recipes/textarea",
    summary: "여러 줄 설명이나 메모를 작성하는 입력 칸입니다.",
    mobileGuideline:
      "긴 글 입력은 대화상자 대신 전용 페이지에서 전체 폭으로 열어야 가상 키보드에 가리지 않습니다.",
    code: `import { Textarea } from "@goraebap/ui/components/textarea";

export function Example() {
  return <Textarea placeholder="변경 이유나 맥락을 간단히 적어 주세요." />;
}`,
    renderDemo: () => (
      <div className="mx-auto max-w-md space-y-3">
        <Textarea placeholder="변경 이유나 맥락을 간단히 적어 주세요." />
      </div>
    ),
  },
  {
    slug: "switch",
    name: "Switch",
    group: "입력 · 동작",
    primitive: "@base-ui/react/switch",
    recipePath: "@goraebap/design-system/recipes/switch",
    summary: "즉시 반영되는 켜짐/꺼짐 설정에 쓰는 토글 스위치입니다.",
    mobileGuideline:
      "스위치 옆 설명과 행 전체 간격을 넉넉히 두어 손가락으로 누르기 쉽게 배치합니다.",
    code: `import { Switch } from "@goraebap/ui/components/switch";

export function Example() {
  return <Switch defaultChecked aria-label="이메일 알림 받기" />;
}`,
    renderDemo: () => <InteractiveSwitchDemo />,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    group: "입력 · 동작",
    primitive: "@base-ui/react/checkbox",
    recipePath: "@goraebap/design-system/recipes/checkbox",
    summary: "여러 항목을 고르거나 동의 여부를 확인하는 체크박스입니다.",
    mobileGuideline: "라벨 텍스트 전체를 클릭 영역으로 묶어 모바일 터치 영역을 넓힙니다.",
    code: `import { Checkbox } from "@goraebap/ui/components/checkbox";

export function Example() {
  return <Checkbox defaultChecked aria-label="세션 유지" />;
}`,
    renderDemo: () => <InteractiveCheckboxDemo />,
  },
  {
    slug: "badge",
    name: "Badge",
    group: "표시 · 구조",
    primitive: "HTML <span>",
    recipePath: "@goraebap/design-system/recipes/badge",
    summary: "상태, 역할, 분류처럼 짧은 메타데이터를 표시합니다.",
    mobileGuideline: "좁은 폭에서 줄바꿈이 자연스럽게 이어지도록 flex-wrap과 함께 씁니다.",
    code: `import { Badge } from "@goraebap/ui/components/badge";

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
    renderDemo: () => (
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
    group: "표시 · 구조",
    primitive: "HTML <div>",
    recipePath: "@goraebap/design-system/recipes/card",
    summary: "페이지 면(--background) 위에 한 단계 올라오는 올린 면(--card) 컨테이너입니다.",
    mobileGuideline:
      "모바일에서는 카드 안쪽 여백을 p-4~p-5로 유지하고, 불필요한 중첩 카드를 피합니다.",
    code: `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@goraebap/ui/components/card";
import { Button } from "@goraebap/ui/components/button";

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
    renderDemo: () => (
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
    group: "표시 · 구조",
    primitive: "HTML <div role='alert'>",
    recipePath: "@goraebap/design-system/recipes/alert",
    summary: "중요한 안내, 성공, 경고, 오류 메시지를 문맥 안에 인라인으로 알립니다.",
    mobileGuideline: "모바일에서도 제목과 본문이 2~3줄 이내로 간결하게 읽히도록 문구를 압축합니다.",
    code: `import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui/components/alert";

export function Example() {
  return (
    <Alert variant="info">
      <AlertTitle>서브도메인 SSO 활성화</AlertTitle>
      <AlertDescription>로그인 세션이 *.goraebap.xyz 전체에 공유됩니다.</AlertDescription>
    </Alert>
  );
}`,
    renderDemo: () => (
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
    group: "표시 · 구조",
    primitive: "@base-ui/react/separator",
    recipePath: "@goraebap/design-system/recipes/separator",
    summary: "영역이나 항목 사이를 --border 1px 선으로 조용하게 나눕니다.",
    mobileGuideline: "구분선 대신 여백으로 묶음이 충분하면 선을 생략해 화면 밀도를 낮춥니다.",
    code: `import { Separator } from "@goraebap/ui/components/separator";

export function Example() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">계정 정보</p>
      <Separator />
      <p className="text-xs text-muted-foreground">admin@goraebap.xyz</p>
    </div>
  );
}`,
    renderDemo: () => (
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
    group: "표시 · 구조",
    primitive: "HTML <div>",
    recipePath: "@goraebap/design-system/recipes/skeleton",
    summary: "데이터를 불러오는 짧은 대기 동안 실제 콘텐츠 자리 모양을 암시합니다.",
    mobileGuideline:
      "화면 전체 스켈레톤 대신 실제 카드/줄 높이에 맞춘 최소한의 자리 표시만 씁니다.",
    code: `import { Skeleton } from "@goraebap/ui/components/skeleton";

export function Example() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <div className="flex-1 space-y-2">
        <Skeleton shape="line" className="w-1/2" />
        <Skeleton shape="line" className="w-3/4" />
      </div>
    </div>
  );
}`,
    renderDemo: () => (
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
    group: "표시 · 구조",
    primitive: "HTML <table>",
    recipePath: "@goraebap/design-system/recipes/table",
    summary: "여러 항목의 속성을 같은 열 기준으로 빠르게 비교하는 표 컴포넌트입니다.",
    mobileGuideline:
      "가로 스크롤 래퍼로 깨짐을 막되, 모바일에서 열이 너무 많으면 카드 목록으로 전환하는 편이 읽기 좋습니다.",
    code: `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@goraebap/ui/components/table";

export function Example() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>서비스</TableHead>
          <TableHead>프레임워크</TableHead>
          <TableHead>테마</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>blog</TableCell>
          <TableCell>React</TableCell>
          <TableCell>Editorial</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}`,
    renderDemo: () => (
      <div className="border-border bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>서비스</TableHead>
              <TableHead>프레임워크</TableHead>
              <TableHead>테마</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">apps/blog</TableCell>
              <TableCell className="font-mono">React</TableCell>
              <TableCell>Editorial</TableCell>
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
              <TableCell className="font-mono">Angular 예정</TableCell>
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
    group: "오버레이 · 탐색",
    primitive: "@base-ui/react/tabs",
    recipePath: "@goraebap/design-system/recipes/tabs",
    summary:
      "같은 맥락 안의 보기를 빠르게 전환하는 탭입니다. 키보드 화살표 탐색을 기본 지원합니다.",
    mobileGuideline: "탭 개수는 모바일 폭(390px)에서 잘리지 않게 2~4개 이내로 유지합니다.",
    code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui/components/tabs";

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
    renderDemo: () => (
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
    group: "오버레이 · 탐색",
    primitive: "@base-ui/react/dialog",
    recipePath: "@goraebap/design-system/recipes/dialog",
    summary:
      "짧은 확인이나 몇 칸짜리 입력을 띄우는 대화상자입니다. 모바일에서는 하단 바텀시트(surface='sheet')로 전환합니다.",
    mobileGuideline:
      "Mobile 390px 토글을 켠 뒤 버튼을 눌러 보세요. 데스크톱 중앙 모달이 하단 시트로 바뀝니다.",
    code: `import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@goraebap/ui/components/dialog";
import { Button } from "@goraebap/ui/components/button";

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
    renderDemo: ({ isMobile }) => <InteractiveDialogDemo isMobile={isMobile} />,
  },
];

export function getComponentDoc(slug: string): ComponentDocSpec | undefined {
  return COMPONENT_DOCS.find((item) => item.slug === slug);
}
