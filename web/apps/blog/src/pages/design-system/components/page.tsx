import { Link, createFileRoute } from "@tanstack/react-router";
import { getComponentDemo } from "@/entities/component-doc";
import { menuDocs } from "@/entities/content-doc";
import { Glossed } from "@/shared/ui";

export const Route = createFileRoute("/design-system/components/")({
  component: ComponentsOverviewPage,
});

// 컴포넌트 문서(content)의 묶음과 순서를 따른다. 견본 그림만 component-doc에서 가져온다.
const DOCS = menuDocs("design-system/components").filter((doc) => !doc.isSkill);
const CATEGORIES = [...new Set(DOCS.map((doc) => doc.meta.group ?? ""))];

function ComponentsOverviewPage() {
  return (
    <div className="space-y-12">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">컴포넌트</h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-relaxed break-keep">
          <Glossed>
            {
              "컴포넌트는 버튼이나 입력창처럼 화면을 이루는 재사용 단위로, 모양과 동작, 접근성을 하나로 묶어 어느 화면에서든 같은 경험을 제공합니다. 외형은 프레임워크와 분리된 스타일 레시피 한 벌로 관리하고, 각 프레임워크의 UI 컴포넌트 어댑터 계층이 여기에 상태와 키보드 조작 같은 동작을 연결합니다."
            }
          </Glossed>
        </p>
      </header>

      {/* Categorized 3-column Live Miniature Preview Grid */}
      <div className="space-y-12">
        {CATEGORIES.map((category) => {
          const items = DOCS.filter((doc) => (doc.meta.group ?? "") === category);
          return (
            <section key={category} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
                <span className="text-muted-foreground font-mono text-xs">{items.length}</span>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    to="/design-system/components/$slug"
                    params={{ slug: item.slug }}
                    className="group min-w-0 space-y-2.5"
                  >
                    <div className="border-border bg-card group-hover:border-foreground/35 flex h-44 items-center justify-center overflow-hidden rounded-2xl border p-4 transition-colors">
                      {getComponentDemo(item.slug)?.renderThumbnail()}
                    </div>
                    <p className="text-foreground px-1 text-sm font-medium">
                      {item.meta.title ?? item.slug}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
