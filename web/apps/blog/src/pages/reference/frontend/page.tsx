import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reference/frontend/")({
  beforeLoad: () => {
    throw redirect({ href: "/reference/frontend/overview", replace: true });
  },
});
