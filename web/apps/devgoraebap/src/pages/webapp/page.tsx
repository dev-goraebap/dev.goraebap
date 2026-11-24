import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/webapp/")({
  beforeLoad: () => {
    throw redirect({ to: "/webapp/$slug", params: { slug: "repository" }, replace: true });
  },
});
