import { createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/docs/primitives/")({
  component: DocsPrimitivesPage,
});

const BOUNDARY_ROWS = [
  {
    ui: "Button / Input / Badge / Card / Alert / Table",
    html: "100% 가능 (네이티브 태그 + CVA 레시피)",
    primitive: "필요 없음 (라우터 링크 합성 시에만 어댑터 활용)",
  },
  {
    ui: "Dialog / Modal",
    html: "네이티브 <dialog>.showModal() + ::backdrop + ESC 가능",
    primitive: "중첩 오버레이 스택 · 스크롤 잠금 · 퇴장 애니메이션 · 모바일 시트 전환",
  },
  {
    ui: "Tabs / Menu / Select",
    html: "role='tablist' 등으로 외형은 가능",
    primitive: "화살표 키보드 이동(Roving Focus) · ARIA 자동 연결 · 충돌 회피 포지셔닝",
  },
  {
    ui: "Switch / Checkbox",
    html: "네이티브 <input type='checkbox'> / role='switch' 가능",
    primitive: "indeterminate 상태 · 폼 통합 · 커스텀 인디케이터 일관성",
  },
];

function DocsPrimitivesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <p className="text-muted-foreground font-mono text-xs">LAYER 03 · ADAPTERS</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pure HTML &amp; Headless Primitives
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          UI 컴포넌트를 만들기 전에도 1·2단계(토큰+레시피)와 네이티브 HTML만으로 대부분을 시각적으로
          검증할 수 있습니다. 3단계 헤드리스 프리미티브는 네이티브 HTML이 보장하지 못하는 복합
          인터랙션과 접근성 계약을 채웁니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Pure HTML과 헤드리스 프리미티브의 경계
        </h2>
        <div className="border-border bg-card overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-xs">
            <thead className="border-border bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">UI 요소</th>
                <th className="px-4 py-3 font-medium">Pure HTML + Recipe만으로</th>
                <th className="px-4 py-3 font-medium">Base UI / Spartan Brain이 채우는 영역</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {BOUNDARY_ROWS.map((row) => (
                <tr key={row.ui}>
                  <td className="px-4 py-3 font-medium">{row.ui}</td>
                  <td className="text-muted-foreground px-4 py-3">{row.html}</td>
                  <td className="text-muted-foreground px-4 py-3">{row.primitive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">프레임워크별 어댑터 매핑</h2>
        <CopyCodeBlock
          label="adapter-mapping.txt"
          language="text"
          code={`Layer 1 (Tokens)   : @goraebap/design-system/styles
Layer 2 (Recipes)  : @goraebap/design-system/recipes/*
──────────────────────────────────────────────────────────
Pure HTML Adapter  : Native HTML (<button>, <dialog>, <details>, <table>)
React Adapter      : @base-ui/react  → @goraebap/ui
Angular Adapter    : @spartan-ng/brain → @goraebap/ui-angular (apps/accounts 예정)`}
        />
      </section>
    </article>
  );
}
