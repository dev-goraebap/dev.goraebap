import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui/components/table";

export const Route = createFileRoute("/ui/primitives/")({
  component: UiPrimitivesPage,
});

const MAPPINGS = [
  {
    widget: "Button",
    react: "@base-ui/react/button",
    angular: "HTML <button> + Directive",
    responsibility: "포커스, 비활성화, 요소 합성(render)",
  },
  {
    widget: "Dialog / Sheet",
    react: "@base-ui/react/dialog",
    angular: "@spartan-ng/brain/dialog (+ CDK)",
    responsibility: "포털, 포커스 트랩, ESC 닫기, 스크롤 잠금",
  },
  {
    widget: "Tabs",
    react: "@base-ui/react/tabs",
    angular: "@spartan-ng/brain/tabs",
    responsibility: "화살표 키 탐색, ARIA tablist/tabpanel 연결",
  },
  {
    widget: "Switch / Checkbox",
    react: "@base-ui/react/switch · checkbox",
    angular: "@spartan-ng/brain/switch · checkbox",
    responsibility: "checked 상태, 키보드 Space 토글, 폼 접근성",
  },
  {
    widget: "Separator",
    react: "@base-ui/react/separator",
    angular: "@spartan-ng/brain/separator",
    responsibility: "orientation 기반 role='separator' 속성",
  },
];

function UiPrimitivesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Badge variant="outline">LAYER 03 · HEADLESS PRIMITIVES</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Headless Primitives</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          접근성(WAI-ARIA), 키보드 탐색, 포커스 트랩, 오버레이 배치는 직접 구현하지 않고 각
          프레임워크의 검증된 Headless 라이브러리에 맡깁니다.
        </p>
      </div>

      <div className="border-border bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>컴포넌트</TableHead>
              <TableHead>React (Base UI)</TableHead>
              <TableHead>Angular (Brain / CDK)</TableHead>
              <TableHead>맡는 동작</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MAPPINGS.map((row) => (
              <TableRow key={row.widget}>
                <TableCell className="font-medium">{row.widget}</TableCell>
                <TableCell className="font-mono text-[11px]">{row.react}</TableCell>
                <TableCell className="font-mono text-[11px]">{row.angular}</TableCell>
                <TableCell className="text-muted-foreground">{row.responsibility}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
