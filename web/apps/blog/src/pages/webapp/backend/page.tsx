import { createFileRoute, redirect } from "@tanstack/react-router";
import { diataxisAllDocs, diataxisDocHref } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/webapp/backend/")({
  beforeLoad: () => {
    const first = diataxisAllDocs("backend")[0];
    throw redirect({
      href: first ? diataxisDocHref(first) : "/glossary?domain=backend",
      replace: true,
    });
  },
});
