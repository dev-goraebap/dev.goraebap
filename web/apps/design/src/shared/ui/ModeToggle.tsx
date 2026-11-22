import { useState } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { SystemIcon } from "@goraebap/ui-react/icons";

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
    <Button
      type="button"
      variant="outline"
      size="icon"
      shape="pill"
      onClick={toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="bg-secondary/60 text-muted-foreground hover:text-foreground size-8"
    >
      <SystemIcon name={dark ? "sun" : "moon"} className="size-4" />
    </Button>
  );
}
