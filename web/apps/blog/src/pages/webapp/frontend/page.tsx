import { createFileRoute, redirect } from "@tanstack/react-router";
import { diataxisAllDocs, diataxisDocHref } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/webapp/frontend/")({
  beforeLoad: () => {
    const first = diataxisAllDocs("frontend")[0];
    throw redirect({
      href: first ? diataxisDocHref(first) : "/glossary?domain=frontend",
      replace: true,
    });
  },
});
