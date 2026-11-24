import { Link, createFileRoute } from "@tanstack/react-router";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { BrandMark, DesignSettings, LineFieldCanvas, Wordmark } from "@/shared/ui";

export const Route = createFileRoute("/")({
  component: WorkshopPage,
});

const WORKSPACE_LINKS = [
  { label: "Playbook", to: "/playbook" },
  { label: "Frontend", to: "/frontend" },
  { label: "Backend", to: "/backend" },
] as const;

function WorkshopPage() {
  return (
    <main className="bg-background text-foreground relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <LineFieldCanvas className="absolute inset-0 size-full" />
      <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-6">
        <DesignSettings />
      </div>
      <div className="relative flex flex-col items-center text-center">
        <BrandMark className="brand-draw size-20 sm:size-24" />
        <h1 className="mt-6">
          <Wordmark className="wordmark-write h-10 w-auto sm:h-12" />
        </h1>
        <p className="workshop-reveal text-muted-foreground mt-2 text-sm break-keep [animation-delay:120ms] sm:text-base">
          웹 애플리케이션을 만들며 다듬어 온 방식을 정리해 두는 작업실
        </p>
        <nav
          aria-label="워크스페이스"
          className="workshop-reveal mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm [animation-delay:240ms]"
        >
          {WORKSPACE_LINKS.map((workspace) => (
            <Link
              key={workspace.to}
              to={workspace.to}
              className="group decoration-foreground/30 hover:decoration-foreground inline-flex items-center gap-1.5 font-medium underline underline-offset-6 transition-colors"
            >
              {workspace.label}
              <SystemIcon
                name="arrowRight"
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
