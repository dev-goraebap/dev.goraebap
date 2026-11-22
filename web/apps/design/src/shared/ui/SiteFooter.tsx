import { Link } from "@tanstack/react-router";

const FOOTER_LINKS = [
  { label: "컴포넌트", to: "/components" as const },
  { label: "레이아웃", to: "/layouts" as const },
  { label: "디테일", to: "/details" as const },
  { label: "테마", to: "/themes" as const },
];

export function SiteFooter({ isContained = true }: { isContained?: boolean }) {
  return (
    <footer className="border-border/80 border-t">
      <div
        className={`text-muted-foreground flex flex-col gap-3 py-8 text-xs sm:flex-row sm:items-center sm:justify-between ${
          isContained ? "mx-auto max-w-7xl px-6" : ""
        }`}
      >
        <span className="text-foreground font-medium">goraebap/design</span>
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
