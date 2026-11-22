import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { logoutCurrentSession, type AuthMe } from "@/entities/session";
import { ACCOUNT_NAV_ITEMS, CONNECTED_SERVICES } from "@/shared/config";
import { AppShell } from "@/shared/ui";

interface AccountsShellProps {
  user: AuthMe;
  children: ReactNode;
}

export function AccountsShell({ user, children }: AccountsShellProps) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );
  const [loggingOut, setLoggingOut] = useState(false);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutCurrentSession();
      await navigate({ to: "/login", search: { next: undefined } });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AppShell
      brand="goraebap accounts"
      subtitle="*.goraebap.xyz"
      navItems={ACCOUNT_NAV_ITEMS}
      sidebarExtra={
        <div className="space-y-1.5 px-2.5">
          <p className="text-muted-foreground font-mono text-[11px]">서비스</p>
          <div className="space-y-0.5">
            {CONNECTED_SERVICES.map((service) => (
              <a
                key={service.name}
                href={service.href}
                className="text-muted-foreground hover:bg-accent hover:text-foreground -mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors"
              >
                <span>{service.name}</span>
                <span aria-hidden="true" className="text-[10px]">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      }
      sidebarFooter={
        <div className="space-y-2.5 px-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{user.name || user.email}</p>
            <p className="text-muted-foreground truncate font-mono text-[11px]">{user.email}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={toggleTheme}>
              {isDark ? "라이트" : "다크"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "…" : "로그아웃"}
            </Button>
          </div>
        </div>
      }
      mobileAction={
        <Button size="sm" variant="outline" onClick={toggleTheme}>
          {isDark ? "라이트" : "다크"}
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}
