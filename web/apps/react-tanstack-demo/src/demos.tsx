import { useState, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";
import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@goraebap/ui-react/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@goraebap/ui-react/components/dialog";
import { Input } from "@goraebap/ui-react/components/input";
import { Label } from "@goraebap/ui-react/components/label";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@goraebap/ui-react/components/menu";
import { OTPField, OTPFieldInput } from "@goraebap/ui-react/components/otp-field";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Skeleton } from "@goraebap/ui-react/components/skeleton";
import { Textarea } from "@goraebap/ui-react/components/textarea";
import { SystemIcon } from "@goraebap/ui-react/icons";

export interface DemoItem {
  slug: string;
  title: string;
  render: () => ReactNode;
}

function ButtonDemo() {
  const [loading, setLoading] = useState(false);

  function triggerLoading() {
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1200);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button>저장</Button>
        <Button variant="secondary">임시 저장</Button>
        <Button variant="outline">미리보기</Button>
        <Button variant="ghost">취소</Button>
        <Button variant="destructive">삭제</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" shape="pill" variant="outline">
          <SystemIcon name="copy" className="size-3.5" />복사
        </Button>
        <Button loading={loading} onClick={triggerLoading}>
          {loading ? "저장 중..." : "비동기 저장 눌러보기"}
        </Button>
        <Button size="icon" variant="outline" aria-label="탐색">
          <SystemIcon name="compass" className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AlertDemo() {
  return (
    <div className="w-full max-w-lg space-y-3">
      <Alert variant="info">
        <AlertTitle>안내</AlertTitle>
        <AlertDescription>변경 사항은 저장 후 모든 세션에 반영됩니다.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>저장 완료</AlertTitle>
        <AlertDescription>설정을 정상적으로 반영했습니다.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>주의</AlertTitle>
        <AlertDescription>이 토큰은 화면을 벗어나면 다시 볼 수 없습니다.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>요청 실패</AlertTitle>
        <AlertDescription>네트워크 연결을 확인한 뒤 다시 시도해 주세요.</AlertDescription>
      </Alert>
    </div>
  );
}

function AvatarDemo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>고</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>GB</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>DEV</AvatarFallback>
      </Avatar>
      <Avatar size="lg" shape="pill">
        <AvatarFallback>UI</AvatarFallback>
      </Avatar>
    </div>
  );
}

function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge variant="default">기본</Badge>
      <Badge variant="secondary">보조</Badge>
      <Badge variant="outline">외곽선</Badge>
      <Badge variant="muted">흐림</Badge>
      <Badge variant="ghost">고스트</Badge>
      <Badge variant="destructive">오류</Badge>
    </div>
  );
}

function CardDemo() {
  return (
    <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>기본 카드</CardTitle>
          <CardDescription>관련 정보를 한 면에 묶어 보여 줍니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            같은 디자인 토큰과 반경 규칙을 React와 Angular가 함께 씁니다.
          </p>
        </CardContent>
      </Card>
      <Card interactive>
        <CardHeader>
          <CardTitle>인터랙티브 카드</CardTitle>
          <CardDescription>마우스를 올려 호버 반응을 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">클릭 가능</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function SeparatorDemo() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">가로 구분선</p>
        <Separator />
      </div>
      <div className="flex h-6 items-center gap-3 text-sm">
        <span>문서</span>
        <Separator orientation="vertical" />
        <span>컴포넌트</span>
        <Separator orientation="vertical" />
        <span>레시피</span>
      </div>
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function InputDemo() {
  const [value, setValue] = useState("dev@goraebap.xyz");
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="demo-email">이메일</Label>
        <Input
          id="demo-email"
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-invalid">오류 상태</Label>
        <Input id="demo-invalid" invalid defaultValue="invalid-email" />
      </div>
    </div>
  );
}

function TextareaDemo() {
  const [text, setText] = useState("");
  return (
    <div className="w-full max-w-md space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="demo-bio">설명</Label>
        <span className="text-muted-foreground text-xs tabular-nums">{text.length} / 120</span>
      </div>
      <Textarea
        id="demo-bio"
        rows={3}
        maxLength={120}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="간단한 소개를 입력해 보세요."
      />
    </div>
  );
}

function OtpFieldDemo() {
  const [code, setCode] = useState("");
  return (
    <div className="flex flex-col items-center gap-3">
      <OTPField length={6} value={code} onValueChange={setCode}>
        {Array.from({ length: 6 }, (_, i) => (
          <OTPFieldInput key={i} />
        ))}
      </OTPField>
      <p className="text-muted-foreground font-mono text-xs">
        입력값: {code || "______"}
      </p>
    </div>
  );
}

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>대화상자 열기</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>변경 사항을 저장할까요?</DialogTitle>
          <DialogDescription>
            저장하면 React와 Angular 양쪽 디자인 시스템에 동일한 토큰이 적용됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>취소</DialogClose>
          <DialogClose render={<Button />}>저장</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenuDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>
          작업 메뉴
          <SystemIcon name="chevronDown" className="size-4" />
        </MenuTrigger>
        <MenuContent>
          <MenuLabel>문서 작업</MenuLabel>
          <MenuItem onClick={() => setSelected("복제")}>복제</MenuItem>
          <MenuItem onClick={() => setSelected("링크 복사")}>링크 복사</MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive" onClick={() => setSelected("삭제")}>
            삭제
          </MenuItem>
        </MenuContent>
      </Menu>
      {selected && (
        <p className="text-muted-foreground text-xs">선택한 작업: {selected}</p>
      )}
    </div>
  );
}

export const REACT_DEMOS: DemoItem[] = [
  { slug: "button", title: "Button", render: () => <ButtonDemo /> },
  { slug: "alert", title: "Alert", render: () => <AlertDemo /> },
  { slug: "avatar", title: "Avatar", render: () => <AvatarDemo /> },
  { slug: "badge", title: "Badge", render: () => <BadgeDemo /> },
  { slug: "card", title: "Card", render: () => <CardDemo /> },
  { slug: "separator", title: "Separator", render: () => <SeparatorDemo /> },
  { slug: "skeleton", title: "Skeleton", render: () => <SkeletonDemo /> },
  { slug: "input", title: "Input", render: () => <InputDemo /> },
  { slug: "textarea", title: "Textarea", render: () => <TextareaDemo /> },
  { slug: "otp-field", title: "OTP Field", render: () => <OtpFieldDemo /> },
  { slug: "dialog", title: "Dialog", render: () => <DialogDemo /> },
  { slug: "menu", title: "Menu", render: () => <MenuDemo /> },
];
