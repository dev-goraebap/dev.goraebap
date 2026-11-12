import { describe, expect, test } from "vitest";
import { BOOT_COLORS, bootCover } from "@/shared/ui/boot-cover/plugin";

/** 토큰(tailwind.css)을 지금 모드로 읽어 rgb 글자로 돌려준다. 검사 문서는 test-setup에서 tailwind.css를 읽는다. */
function tokenColor(name: string, mode: "light" | "dark") {
  const scope = document.createElement("div");
  scope.dataset.theme = mode;
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  scope.append(probe);
  document.body.append(scope);
  try { return getComputedStyle(probe).color; } finally { scope.remove(); }
}

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

describe("첫 방문 덮개", () => {
  // 덮개는 앱 CSS가 오기 전에 쓰므로 토큰 값을 그대로 적어 둔다. 토큰을 바꾸면 여기서 어긋남이 드러난다.
  test("덮개의 바탕 · 잉크가 토큰(--background · --muted-foreground)과 같다", () => {
    (["light", "dark"] as const).forEach((mode, index) => {
      expect(tokenColor("--background", mode)).toBe(rgb(BOOT_COLORS.background[index]));
      expect(tokenColor("--muted-foreground", mode)).toBe(rgb(BOOT_COLORS.ink[index]));
    });
  });

  test("index.html의 앱 자리에 덮개와 모드 적용을 넣는다", () => {
    const plugin = bootCover({ mark: "<svg></svg>", modeKey: "guide-theme" });
    const transform = plugin.transformIndexHtml as (html: string) => string;
    const html = transform('<html><head></head><body><div id="root"></div></body></html>');
    expect(html).toContain('<div id="root"><section class="boot" role="status" aria-label="불러오는 중입니다">');
    expect(html).toContain('localStorage.getItem("guide-theme")');
    expect(() => transform("<html><head></head><body></body></html>")).toThrow();
  });
});
