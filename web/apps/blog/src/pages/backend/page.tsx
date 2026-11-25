import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/backend/")({
  beforeLoad: () => {
    throw redirect({ to: "/backend/engineering", replace: true });
  },
});
