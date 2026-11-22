import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ModeToggle() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true,
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("goraebap-design-mode", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="border-border bg-secondary/60 text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
