import { describe, expect, test } from "vitest";
import { workspaceTheme } from "@kit/foundations/theme";
import { bootColors } from "@kit/patterns/boot/boot-colors";
import { bootCover } from "@kit/patterns/boot/boot-cover";

describe("첫 방문 덮개", () => {
  // 덮개는 앱 CSS가 오기 전에 쓰므로 테마 값을 그대로 적어 둔다. 테마를 바꾸면 여기서 어긋남이 드러난다.
  test("덮개 색이 테마의 기준 색과 같다", () => {
    const tokens = (workspaceTheme as unknown as { tokens: Record<string, string> }).tokens;
    expect(tokens["--color-background-body"]).toBe(`light-dark(${bootColors.body.join(", ")})`);
    expect(tokens["--color-background-surface"]).toBe(`light-dark(${bootColors.surface.join(", ")})`);
    expect(tokens["--color-text-secondary"]).toBe(`light-dark(${bootColors.secondary.join(", ")})`);
  });

  test("index.html의 앱 자리에 덮개와 모드 적용을 넣는다", () => {
    const plugin = bootCover({ mark: "<svg></svg>", modeKey: "demo-mode" });
    const transform = plugin.transformIndexHtml as (html: string) => string;
    const html = transform('<html><head></head><body><div id="root"></div></body></html>');
    expect(html).toContain('<div id="root"><section class="boot" role="status" aria-label="불러오는 중입니다">');
    expect(html).toContain('localStorage.getItem("demo-mode")');
    expect(() => transform("<html><head></head><body></body></html>")).toThrow();
  });
});
