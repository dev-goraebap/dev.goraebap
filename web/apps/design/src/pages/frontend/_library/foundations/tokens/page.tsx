import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import {
  FONT_FAMILIES,
  RADIUS_SCALE,
  TOKEN_SETS,
  groupColorTokens,
  resolveTokens,
  substituteVars,
  toHexColor,
  type TokenMode,
} from "@/entities/design-token";
import { useDesignConfig } from "@/shared/lib/design-config";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/frontend/_library/foundations/tokens/")({
  component: DesignTokensPage,
});

function TokenSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {count !== undefined && (
          <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
        )}
      </div>
      <div className="border-border overflow-hidden rounded-lg border">{children}</div>
    </section>
  );
}

function radiusInRem(value: string, baseRem: number) {
  const factor = value.match(/\*\s*([\d.]+)/)?.[1];
  const rem = factor ? baseRem * Number(factor) : baseRem;
  return `${Number(rem.toFixed(4))}rem`;
}

function DesignTokensPage() {
  const { config } = useDesignConfig();
  const [setId, setSetId] = useState(config.theme as string);
  const [mode, setMode] = useState<TokenMode>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const tokenSet = TOKEN_SETS.find((item) => item.id === setId) ?? TOKEN_SETS[0];
  const groups = useMemo(() => {
    const values = resolveTokens(tokenSet, mode);
    return groupColorTokens(values).map((group) => ({
      ...group,
      tokens: group.tokens.map((token) => {
        const color = substituteVars(token.value, values);
        return { ...token, color, hex: toHexColor(color) };
      }),
    }));
  }, [tokenSet, mode]);
  const baseRadius = parseFloat(config.radius);

  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">디자인 토큰</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          색상 테마, 반경, 타이포그래피의 시각 기준을 CSS 변수로 정의해 라이트·다크 모드와 영역별
          테마 전환에 씁니다.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">테마 색상</h2>

        <div className="bg-background/90 flex flex-wrap items-center gap-2 py-2 backdrop-blur-sm lg:sticky lg:top-14 lg:z-10">
          <ToggleGroup
            aria-label="색상 모드"
            value={[mode]}
            onValueChange={(next) => {
              if (next[0]) setMode(next[0] as TokenMode);
            }}
          >
            <ToggleGroupItem value="light" size="sm">
              라이트
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" size="sm">
              다크
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            aria-label="색상 테마"
            value={[tokenSet.id]}
            onValueChange={(next) => {
              if (next[0]) setSetId(next[0]);
            }}
            className="max-w-full overflow-x-auto"
          >
            {TOKEN_SETS.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} size="sm" className="shrink-0">
                {item.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {groups.map((group) => (
          <TokenSection key={group.title} title={group.title} count={group.tokens.length}>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-auto sm:w-[38%]">토큰</TableHead>
                  <TableHead className="hidden sm:table-cell">용도</TableHead>
                  <TableHead className="w-28">값</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.tokens.map((token) => (
                  <TableRow key={token.name}>
                    <TableCell>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="ring-foreground/15 size-5 shrink-0 rounded ring-1"
                          style={{ backgroundColor: token.color }}
                        />
                        <span className="min-w-0">
                          <code className="text-foreground block font-mono text-xs break-all">
                            {token.name}
                          </code>
                          <span className="text-muted-foreground mt-0.5 block text-xs sm:hidden">
                            {token.role}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                      {token.role}
                    </TableCell>
                    <TableCell title={token.value}>
                      <code className="text-muted-foreground font-mono text-xs">{token.hex}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TokenSection>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">반경</h2>
        <TokenSection title="둥글기 단계" count={RADIUS_SCALE.length}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>토큰</TableHead>
                <TableHead className="w-24">미리보기</TableHead>
                <TableHead className="w-28">값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RADIUS_SCALE.map((token) => {
                const rem = radiusInRem(token.value, baseRadius);
                return (
                  <TableRow key={token.name}>
                    <TableCell>
                      <code className="font-mono text-xs break-all">{token.name}</code>
                    </TableCell>
                    <TableCell>
                      <span
                        aria-hidden="true"
                        className="border-input bg-muted block size-8 border"
                        style={{ borderRadius: rem }}
                      />
                    </TableCell>
                    <TableCell title={token.value}>
                      <code className="text-muted-foreground font-mono text-xs">{rem}</code>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TokenSection>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">타이포그래피</h2>
        <TokenSection title="글꼴" count={FONT_FAMILIES.length}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">토큰</TableHead>
                <TableHead>미리보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FONT_FAMILIES.map((token) => (
                <TableRow key={token.name}>
                  <TableCell>
                    <code className="font-mono text-xs break-all">{token.name}</code>
                  </TableCell>
                  <TableCell title={token.value}>
                    <span className="block truncate text-base" style={{ fontFamily: token.value }}>
                      Aa 가나다 123
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TokenSection>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">적용</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          영역 요소에 data-ds-theme을 지정해 색상 테마를 정하고, 상위 요소의 dark 클래스로 다크
          모드를 전환합니다.
        </p>
        <CopyCodeBlock
          label={tokenSet.source}
          language="html"
          code={`<html${mode === "dark" ? ' class="dark"' : ""} data-ds-theme="${tokenSet.id}">`}
        />
      </section>
    </article>
  );
}
