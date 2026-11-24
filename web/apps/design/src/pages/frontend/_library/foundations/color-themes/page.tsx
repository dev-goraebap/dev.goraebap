import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";
import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";
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
import { Checkbox } from "@goraebap/ui-react/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@goraebap/ui-react/components/dialog";
import { Input } from "@goraebap/ui-react/components/input";
import { Progress } from "@goraebap/ui-react/components/progress";
import { Switch } from "@goraebap/ui-react/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { SystemIcon } from "@goraebap/ui-react/icons";
import {
  FONT_OPTIONS,
  HEADING_OPTIONS,
  THEME_PRESETS,
  useDesignConfig,
} from "@/shared/lib/design-config";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/frontend/_library/foundations/color-themes/")({
  component: ColorThemesPage,
});

function ColorThemesPage() {
  const { config, updateConfig } = useDesignConfig();
  const [notify, setNotify] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(true);

  const activePreset = THEME_PRESETS.find((t) => t.id === config.theme) ?? THEME_PRESETS[0];

  const cssVars = [
    config.radius !== "0.5rem" ? `  --radius: ${config.radius};` : null,
    config.font !== "pretendard"
      ? `  --font-sans: ${FONT_OPTIONS.find((f) => f.id === config.font)?.stack};`
      : null,
    config.heading !== "same"
      ? `  --font-heading: ${HEADING_OPTIONS.find((h) => h.id === config.heading)?.stack};`
      : null,
  ].filter(Boolean);

  const generatedCode = `@import "@goraebap/design-system/styles/base.css";
@import "${activePreset.cssFile}";

<!-- <html data-ds-theme="${config.theme}"> · IconProvider="${config.iconSet}" -->${
    cssVars.length > 0 ? `\n\n:root {\n${cssVars.join("\n")}\n}` : ""
  }`;

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">색상 테마</h1>
        <p className="text-muted-foreground text-lg leading-relaxed break-keep">
          색상 테마는 면, 글자, 강조, 상태 색을 라이트와 다크 한 쌍으로 묶은 토큰 세트입니다.
          컴포넌트를 고치지 않고 세트만 바꿔 제품의 분위기를 전환합니다.
        </p>
      </header>

      {/* 1. Theme Palette Picker (5 complete light/dark palettes) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">팔레트</h2>
          <span className="text-muted-foreground font-mono text-xs">
            data-ds-theme=&quot;{config.theme}&quot;
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = config.theme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateConfig("theme", preset.id)}
                className={
                  isSelected
                    ? "border-primary bg-card ring-primary/20 flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-4 text-left ring-2 transition-all"
                    : "border-border bg-card hover:border-foreground/30 flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 text-left transition-all"
                }
              >
                <div className="flex items-center gap-1.5">
                  {preset.swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="border-border/80 h-5 flex-1 rounded-md border"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{preset.name}</span>
                    {isSelected && <SystemIcon name="check" className="text-primary size-3.5" />}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">{preset.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Realistic Mini-App Preview Canvas */}
      <section className="border-border bg-sidebar overflow-hidden rounded-3xl border shadow-xs">
        <div className="grid lg:grid-cols-12">
          {/* Mini Sidebar */}
          <aside className="border-border hidden flex-col justify-between border-r p-4 lg:col-span-3 lg:flex">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Avatar size="sm">
                  <AvatarFallback>GB</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">Goraebap Studio</p>
                  <p className="text-muted-foreground truncate text-[0.6875rem]">
                    {activePreset.name}
                  </p>
                </div>
              </div>
              <nav className="space-y-1 text-xs">
                {[
                  { label: "대시보드", icon: "overview" as const, active: true },
                  { label: "컴포넌트", icon: "components" as const, active: false },
                  { label: "레이아웃", icon: "layouts" as const, active: false },
                  { label: "디테일", icon: "details" as const, active: false },
                ].map((nav) => (
                  <div
                    key={nav.label}
                    className={
                      nav.active
                        ? "bg-secondary text-foreground flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium"
                        : "text-muted-foreground flex items-center gap-2 rounded-lg px-2.5 py-2"
                    }
                  >
                    <SystemIcon name={nav.icon} className="size-3.5" />
                    <span>{nav.label}</span>
                  </div>
                ))}
              </nav>
            </div>
            <div className="border-border bg-background rounded-xl border p-3">
              <div className="flex items-center justify-between text-[0.6875rem]">
                <span className="font-medium">월간 빌드 할당량</span>
                <span className="text-muted-foreground font-mono">72%</span>
              </div>
              <Progress value={72} className="mt-2" />
            </div>
          </aside>

          {/* Mini Main Surface */}
          <div className="bg-background space-y-5 p-6 lg:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">워크스페이스 미리보기</h2>
                <p className="text-muted-foreground text-xs">
                  사이드바(--sidebar), 본문(--background), 카드(--card), 팝오버(--popover) 위계를
                  함께 확인합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger render={<Button size="sm" variant="outline" />}>
                    대화상자 확인
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>{activePreset.name} 색상 테마</DialogTitle>
                    <DialogDescription>
                      현재 선택한 색상, 모서리 반경, 아이콘 세트가 팝오버 면에도 그대로 적용됩니다.
                    </DialogDescription>
                    <div className="mt-4 flex justify-end gap-2">
                      <DialogClose render={<Button size="sm" variant="ghost" />}>취소</DialogClose>
                      <DialogClose render={<Button size="sm" />}>확인</DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" shape="pill">
                  새 배포
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>프로젝트 설정</CardTitle>
                    <Badge variant="secondary">운영 중</Badge>
                  </div>
                  <CardDescription>입력 칸, 스위치, 체크박스, 버튼 조합입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input defaultValue="design.goraebap.xyz" aria-label="도메인" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium">배포 알림 받기</span>
                    <Switch checked={notify} onCheckedChange={setNotify} aria-label="배포 알림" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="theme-auto-deploy"
                      checked={autoDeploy}
                      onCheckedChange={setAutoDeploy}
                    />
                    <label htmlFor="theme-auto-deploy" className="cursor-pointer text-xs">
                      main 브랜치 푸시 시 자동 빌드
                    </label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="sm">저장</Button>
                  <Button size="sm" variant="secondary">
                    임시 저장
                  </Button>
                  <Button size="sm" variant="ghost">
                    취소
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>탭 · 상태 배지</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Tabs defaultValue="summary">
                      <TabsList>
                        <TabsTrigger value="summary">요약</TabsTrigger>
                        <TabsTrigger value="tokens">토큰</TabsTrigger>
                      </TabsList>
                      <TabsContent value="summary" className="text-muted-foreground text-xs">
                        선택한 색상 테마는 포털의 모든 컴포넌트와 레이아웃 페이지에도 그대로
                        유지됩니다.
                      </TabsContent>
                      <TabsContent value="tokens" className="text-muted-foreground text-xs">
                        라이트·다크 모드 전환 버튼으로 두 모드의 대비를 바로 비교할 수 있습니다.
                      </TabsContent>
                    </Tabs>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge>Primary</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Alert variant="info">
                  <AlertTitle>색상 테마 실시간 적용</AlertTitle>
                  <AlertDescription>
                    헤더의 디자인 설정에서 화면 모드를 바꿔 {activePreset.name}의 라이트와 다크를
                    함께 확인해 보세요.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Generated Import Snippet */}
      <CopyCodeBlock label="적용 스니펫" language="css" code={generatedCode} />
    </article>
  );
}
