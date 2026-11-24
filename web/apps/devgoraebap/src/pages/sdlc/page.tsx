import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sdlc/")({
  beforeLoad: () => {
    throw redirect({ to: "/sdlc/$slug", params: { slug: "overview" }, replace: true });
  },
});
