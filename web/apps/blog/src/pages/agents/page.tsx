import { createFileRoute, redirect } from "@tanstack/react-router";
import { diataxisAllDocs, diataxisDocHref } from "@/entities/diataxis-doc";

export const Route = createFileRoute("/agents/")({
  beforeLoad: () => {
    const first = diataxisAllDocs("agents")[0];
    throw redirect({
      href: first ? diataxisDocHref(first) : "/",
      replace: true,
    });
  },
});
