import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/_library/adapters/primitives/")({
  component: DocsPrimitivesPage,
});

const BOUNDARY_ROWS = [
  {
    ui: "Button / Input / Badge / Card / Alert / Table",
    html: "네이티브 요소와 레시피 함수로 구성",
    primitive: "불필요 (라우터 링크를 합성할 때만 사용)",
  },
  {
    ui: "Dialog / Modal",
    html: "네이티브 <dialog>.showModal(), ::backdrop, ESC 닫기 지원",
    primitive: "중첩 오버레이 스택, 스크롤 잠금, 퇴장 애니메이션, 모바일 시트 전환",
  },
  {
    ui: "Tabs / Menu / Select",
    html: "role='tablist' 등으로 외형만 구성",
    primitive: "화살표 키보드 이동(Roving Focus), ARIA 자동 연결, 충돌 회피 배치",
  },
  {
    ui: "Switch / Checkbox",
    html: "네이티브 <input type='checkbox'>, role='switch'로 기본 동작 구성",
    primitive: "indeterminate 상태, 폼 통합, 커스텀 인디케이터 스타일 통일",
  },
];

function DocsPrimitivesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pure HTML &amp; Headless Primitives
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          스타일 계층과 상호작용 계층을 분리해 필요한 만큼만 조합합니다. 단순한 UI는 네이티브 HTML에
          레시피를 바로 적용하고, 키보드 탐색·포커스 관리·오버레이 제어가 필요한 컴포넌트에만
          헤드리스 프리미티브를 결합합니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Pure HTML과 헤드리스 프리미티브의 경계
        </h2>
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3">컴포넌트</TableHead>
                <TableHead className="px-4 py-3">Pure HTML + Recipe</TableHead>
                <TableHead className="px-4 py-3">헤드리스 프리미티브의 역할</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BOUNDARY_ROWS.map((row) => (
                <TableRow key={row.ui}>
                  <TableCell className="px-4 py-3 font-medium">{row.ui}</TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3">{row.html}</TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3">{row.primitive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">환경별 구성</h2>
        <CopyCodeBlock
          label="adapter-mapping.txt"
          language="text"
          code={`Tokens             : @goraebap/design-system/styles
Recipes            : @goraebap/design-system/recipes/*
──────────────────────────────────────────────────────────
Pure HTML Adapter  : Native HTML (<button>, <dialog>, <details>, <table>)
React Adapter      : @base-ui/react  → @goraebap/ui-react
Angular Adapter    : @spartan-ng/brain + @goraebap/design-system/recipes/*`}
        />
      </section>
    </article>
  );
}
