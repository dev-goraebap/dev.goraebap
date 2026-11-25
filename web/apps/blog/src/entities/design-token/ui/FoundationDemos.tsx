import { useMemo, useState, type ReactNode } from "react";
import buttonRecipeSource from "@goraebap/design-system/recipes/button?raw";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import { toHexColor } from "@/shared/lib/css-color";
import { useDesignConfig } from "@/shared/lib/design-config";
import { CopyCodeBlock } from "@/shared/ui";
import { substituteVars } from "../lib/resolve-color";
import {
  FONT_FAMILIES,
  RADIUS_SCALE,
  TOKEN_SETS,
  groupColorTokens,
  resolveTokens,
  type TokenMode,
} from "../model/token-sets";

// 파운데이션 문서(content/frontend/design-system)가 <Demo>로 그리는 토큰 표. 값은 디자인 시스템 패키지의 CSS에서 읽는다.

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

/** 색 테마와 라이트·다크를 골라 색 토큰 값을 보고, 문서 루트에 붙일 속성을 보인다. */
export function ThemeTokensDemo() {
  const { config } = useDesignConfig();
  const [setId, setSetId] = useState(config.theme as string);
  // 정적 페이지를 만드는 서버에는 document가 없다. 그때는 라이트로 그린다.
  const [mode, setMode] = useState<TokenMode>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
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

      <CopyCodeBlock
        label={tokenSet.source}
        language="html"
        code={`<html${mode === "dark" ? ' class="dark"' : ""} data-ds-theme="${tokenSet.id}">`}
      />
    </div>
  );
}

function radiusInRem(value: string, baseRem: number) {
  const factor = value.match(/\*\s*([\d.]+)/)?.[1];
  const rem = factor ? baseRem * Number(factor) : baseRem;
  return `${Number(rem.toFixed(4))}rem`;
}

/** 디자인 시스템의 둥글기 단계와 지금 설정한 기준 반경으로 계산한 값 */
export function RadiusScaleDemo() {
  const { config } = useDesignConfig();
  const baseRadius = parseFloat(config.radius);
  return (
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
  );
}

/** 디자인 시스템의 글꼴 토큰과 미리보기 */
export function FontFamiliesDemo() {
  return (
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
  );
}

/** 디자인 시스템 패키지의 버튼 레시피 원본 */
export function ButtonRecipeSource() {
  return (
    <CopyCodeBlock
      label="packages/design-system/src/recipes/button.ts"
      language="ts"
      code={buttonRecipeSource.trimEnd()}
    />
  );
}
