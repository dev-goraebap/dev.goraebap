import { Link } from "@tanstack/react-router";
import { VISIBLE_MENUS } from "@/shared/config/site-menus";
import { Wordmark } from "./Wordmark";

export function SiteFooter({ isContained = true }: { isContained?: boolean }) {
  return (
    <footer className="border-border/80 border-t">
      <div
        className={`text-muted-foreground flex flex-col gap-3 py-8 text-xs sm:flex-row sm:items-center sm:justify-between ${
          isContained ? "mx-auto max-w-7xl px-6" : ""
        }`}
      >
        <Wordmark className="text-foreground h-4.5 w-auto self-start sm:self-auto" />
        <div className="flex flex-wrap items-center gap-4">
          {VISIBLE_MENUS.map((menu) => (
            <Link key={menu.label} to={menu.to} className="hover:text-foreground transition-colors">
              {menu.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
