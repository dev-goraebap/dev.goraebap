import { Link, createFileRoute } from "@tanstack/react-router";
import { DETAIL_DOCS } from "@/entities/detail-doc";

export const Route = createFileRoute("/details/")({
  component: DetailsOverviewPage,
});

function DetailsOverviewPage() {
  return (
    <div className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">디테일</h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          컴포넌트와 레이아웃만으로는 채워지지 않는 스크롤, 화면 전환, 흔들림 방지 같은 마감 기준을
          정리합니다. 정해진 정답은 아니지만, 웹 프로젝트를 만들 때마다 늘 챙기는 부분들입니다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {DETAIL_DOCS.map((item) => (
          <Link
            key={item.slug}
            to="/details/$slug"
            params={{ slug: item.slug }}
            className="border-border bg-card hover:border-foreground/30 space-y-1.5 rounded-2xl border p-5 transition-colors"
          >
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">{item.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
