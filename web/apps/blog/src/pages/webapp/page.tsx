import { createFileRoute, redirect } from "@tanstack/react-router";
import { diataxisAllDocs, diataxisDocHref } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/webapp/")({
  beforeLoad: () => {
    const first = diataxisAllDocs("webapp")[0];
    throw redirect({
      href: first ? diataxisDocHref(first) : "/webapp/frontend",
      replace: true,
    });
  },
});
