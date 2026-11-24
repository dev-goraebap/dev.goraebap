import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";

const FOOTER_LINKS = [
  { label: "Design System", to: "/frontend/overview" as const },
  { label: "디테일", to: "/frontend/details" as const },
];

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
          {FOOTER_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
