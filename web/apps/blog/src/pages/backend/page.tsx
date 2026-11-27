import { createFileRoute, redirect } from "@tanstack/react-router";
import { backendAllDocs, backendDocHref } from "@/entities/backend-doc";

export const Route = createFileRoute("/backend/")({
  beforeLoad: () => {
    const first = backendAllDocs()[0];
    throw redirect({
      href: first ? backendDocHref(first) : "/backend/glossary",
      replace: true,
    });
  },
});
