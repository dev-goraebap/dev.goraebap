import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { Switch } from "@goraebap/ui-react/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { SystemIcon } from "@goraebap/ui-react/icons";
import {
  ACCENT_OPTIONS,
  BASE_OPTIONS,
  FONT_OPTIONS,
  HEADING_OPTIONS,
  ICON_SET_OPTIONS,
  RADIUS_OPTIONS,
  useDesignConfig,
} from "@/shared/lib/design-config";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/themes/")({
  component: ThemesPage,
});

const COMPARE_THEMES = [
  {
    id: "app" as const,
    name: "App Theme",
    token: 'data-ds-theme="app"',
    target: "작업 화면 · 대시보드 · 설정",
    desc: "중립 무채색과 뚜렷한 면 위계로 정보 밀도가 높은 작업 화면에 맞춘 테마입니다.",
  },
  {
    id: "editorial" as const,
    name: "Editorial Theme",
    token: 'data-ds-theme="editorial"',
    target: "블로그 · 기술 문서 · 아티클",
    desc: "따뜻한 종이 톤으로 긴 글과 문서를 편안하게 읽도록 맞춘 테마입니다.",
  },
];

function ThemesPage() {
  const { config, updateConfig, resetConfig } = useDesignConfig();
  const [notify, setNotify] = useState(true);
  const [keepSession, setKeepSession] = useState(true);

  const htmlAttrs = [
    `data-ds-theme="${config.base}"`,
    config.accent !== "default" ? `data-ds-accent="${config.accent}"` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = [
    config.radius !== "0.5rem" ? `  --radius: ${config.radius};` : null,
    config.font !== "pretendard"
      ? `  --font-sans: ${FONT_OPTIONS.find((f) => f.id === config.font)?.stack};`
      : null,
    config.heading !== "same"
      ? `  --font-heading: ${HEADING_OPTIONS.find((h) => h.id === config.heading)?.stack};`
      : null,
  ].filter(Boolean);

  const generatedCode = `<html ${htmlAttrs}>
  <!-- IconProvider: value="${config.iconSet}" -->
</html>${cssVars.length > 0 ? `\n\n:root {\n${cssVars.join("\n")}\n}` : ""}`;

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-6 py-12">
      <header className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Themes</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            바닥 팔레트(Base Color), 포인트 색(Theme Color), 반경(Radius), 폰트, 아이콘 세트를
            조합해 사이트 전체와 컴포넌트의 분위기를 실시간으로 바꿉니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetConfig}>
          <SystemIcon name="reset" className="size-3.5" />
          <span>기본값으로 초기화</span>
        </Button>
      </header>

      {/* Interactive Theme Customizer */}
      <section className="grid gap-8 lg:grid-cols-12">
        {/* Controls Column */}
        <Card className="space-y-6 lg:col-span-5">
          {/* Base Color */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Base Color</h2>
              <span className="text-muted-foreground font-mono text-[11px]">data-ds-theme</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {BASE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig("base", opt.id)}
                  className={
                    config.base === opt.id
                      ? "border-primary bg-accent/60 cursor-pointer rounded-lg border-2 p-3 text-left transition-colors"
                      : "border-border bg-background hover:bg-accent/40 cursor-pointer rounded-lg border p-3 text-left transition-colors"
                  }
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color (Accent) */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Theme Color</h2>
              <span className="text-muted-foreground font-mono text-[11px]">data-ds-accent</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig("accent", opt.id)}
                  className={
                    config.accent === opt.id
                      ? "border-primary bg-accent/60 flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors"
                      : "border-border bg-background hover:bg-accent/40 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
                  }
                >
                  <span
                    className="border-border size-3.5 shrink-0 rounded-full border"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Radius</h2>
              <span className="text-muted-foreground font-mono text-[11px]">--radius</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig("radius", opt.id)}
                  className={
                    config.radius === opt.id
                      ? "border-primary bg-accent/60 cursor-pointer rounded-lg border-2 py-2 font-mono text-xs font-medium transition-colors"
                      : "border-border bg-background hover:bg-accent/40 cursor-pointer rounded-lg border py-2 font-mono text-xs transition-colors"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Font & Heading Font */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Font</h2>
              <div className="space-y-1.5">
                {FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig("font", opt.id)}
                    className={
                      config.font === opt.id
                        ? "border-primary bg-accent/60 block w-full cursor-pointer rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors"
                        : "border-border bg-background hover:bg-accent/40 block w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Heading</h2>
              <div className="space-y-1.5">
                {HEADING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig("heading", opt.id)}
                    className={
                      config.heading === opt.id
                        ? "border-primary bg-accent/60 block w-full cursor-pointer rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors"
                        : "border-border bg-background hover:bg-accent/40 block w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Icon Library */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Icon Library</h2>
              <span className="text-muted-foreground font-mono text-[11px]">IconProvider</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ICON_SET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConfig("iconSet", opt.id)}
                  className={
                    config.iconSet === opt.id
                      ? "border-primary bg-accent/60 flex cursor-pointer items-center gap-2.5 rounded-lg border-2 p-3 text-left transition-colors"
                      : "border-border bg-background hover:bg-accent/40 flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-left transition-colors"
                  }
                >
                  <SystemIcon name="sun" iconSet={opt.id} className="size-4 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{opt.label}</p>
                    <p className="text-muted-foreground text-[11px]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Live Preview Column */}
        <div className="space-y-6 lg:col-span-7">
          <div className="border-border bg-dots bg-background/70 space-y-5 rounded-2xl border p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">실시간 미리보기</h2>
              <div className="flex items-center gap-1.5">
                <Badge>{config.base}</Badge>
                <Badge variant="secondary">{config.accent}</Badge>
                <Badge variant="outline">{config.iconSet}</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 설정</CardTitle>
                  <CardDescription>
                    변경한 토큰이 버튼·입력·모서리에 즉시 반영됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input defaultValue="dev.goraebap" aria-label="프로젝트 이름" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium">알림 받기</span>
                    <Switch checked={notify} onCheckedChange={setNotify} aria-label="알림 받기" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="theme-preview-check"
                      checked={keepSession}
                      onCheckedChange={setKeepSession}
                    />
                    <label htmlFor="theme-preview-check" className="cursor-pointer text-xs">
                      설정을 브라우저에 저장
                    </label>
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap">
                  <Button size="sm">저장</Button>
                  <Button size="sm" variant="secondary">
                    미리보기
                  </Button>
                  <Button size="sm" shape="pill" variant="outline">
                    Pill
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>아이콘 · 탭 · 대화상자</CardTitle>
                    <CardDescription>
                      Icon Library를 바꾸면 닫기·체크·시스템 아이콘이 함께 바뀝니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-foreground flex items-center gap-3">
                      <SystemIcon name="search" className="size-4" />
                      <SystemIcon name="copy" className="size-4" />
                      <SystemIcon name="check" className="size-4" />
                      <SystemIcon name="close" className="size-4" />
                      <SystemIcon name="sun" className="size-4" />
                      <SystemIcon name="moon" className="size-4" />
                    </div>
                    <Tabs defaultValue="app">
                      <TabsList>
                        <TabsTrigger value="app">개요</TabsTrigger>
                        <TabsTrigger value="code">설정</TabsTrigger>
                      </TabsList>
                      <TabsContent value="app" className="text-muted-foreground text-xs">
                        다른 페이지로 이동해도 현재 설정이 그대로 유지됩니다.
                      </TabsContent>
                      <TabsContent value="code" className="text-muted-foreground text-xs">
                        아래 스니펫을 앱 루트에 적용하면 같은 스타일을 재현합니다.
                      </TabsContent>
                    </Tabs>
                    <Dialog>
                      <DialogTrigger render={<Button size="sm" variant="outline" />}>
                        대화상자에서 확인
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>현재 테마가 적용된 대화상자</DialogTitle>
                        <DialogDescription>
                          우측 상단 닫기 아이콘과 모서리 반경, 포인트 색을 확인해 보세요.
                        </DialogDescription>
                        <div className="mt-4 flex justify-end gap-2">
                          <DialogClose render={<Button size="sm" variant="ghost" />}>
                            취소
                          </DialogClose>
                          <DialogClose render={<Button size="sm" />}>확인</DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Alert variant="info">
                  <AlertTitle>전역 실시간 반영</AlertTitle>
                  <AlertDescription>
                    여기서 고른 설정은 컴포넌트·레이아웃 페이지에도 그대로 적용됩니다.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <CopyCodeBlock label="theme-config.html" language="html" code={generatedCode} />
        </div>
      </section>

      {/* App vs Editorial Side-by-Side Comparison */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Base Color 비교</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {COMPARE_THEMES.map((t) => (
            <section
              key={t.id}
              data-ds-theme={t.id}
              className="border-border bg-background text-foreground space-y-5 rounded-3xl border p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="text-muted-foreground text-xs">{t.desc}</p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {t.token}
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>워크스페이스 설정</CardTitle>
                  <CardDescription>{t.target}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input defaultValue="hello@goraebap.xyz" readOnly />
                </CardContent>
                <CardFooter>
                  <Button size="sm">저장</Button>
                  <Button size="sm" variant="secondary">
                    임시 저장
                  </Button>
                  <Button size="sm" variant="outline">
                    취소
                  </Button>
                </CardFooter>
              </Card>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
