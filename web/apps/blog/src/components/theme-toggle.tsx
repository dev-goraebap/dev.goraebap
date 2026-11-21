import { useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="border-border text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
    >
      <span
        aria-hidden="true"
        className="bg-foreground/70 size-2 rounded-full transition-transform"
      />
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
