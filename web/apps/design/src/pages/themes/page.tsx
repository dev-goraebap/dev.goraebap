import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/themes/")({
  component: ThemesPage,
});

const THEMES = [
  {
    id: "app" as const,
    name: "App Theme",
    token: 'data-theme="app"',
    target: "apps/accounts · apps/productivity",
    desc: "중립 무채색 캔버스와 4단계 면 위계를 쓰는 작업 화면용 테마입니다.",
  },
  {
    id: "editorial" as const,
    name: "Editorial Theme",
    token: 'data-theme="editorial"',
    target: "apps/blog",
    desc: "따뜻한 배경 톤으로 긴 기술 글과 문서에 맞춘 테마입니다.",
  },
];

function ThemesPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-12 px-6 py-12">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Themes</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          같은 컴포넌트와 레시피에 <code>data-theme</code> 속성을 바꿔 제품과 블로그 테마를
          전환합니다.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {THEMES.map((t) => (
          <section
            key={t.id}
            data-theme={t.id}
            className="border-border bg-background text-foreground space-y-5 rounded-3xl border p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <p className="text-muted-foreground text-xs">{t.desc}</p>
              </div>
              <Badge variant="outline" className="font-mono">
                {t.token}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>샘플 워크스페이스 카드</CardTitle>
                <CardDescription>적용 대상: {t.target}</CardDescription>
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
    </main>
  );
}
