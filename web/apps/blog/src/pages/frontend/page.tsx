import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/frontend/")({
  beforeLoad: () => {
    throw redirect({ href: "/reference/frontend", replace: true });
  },
});
