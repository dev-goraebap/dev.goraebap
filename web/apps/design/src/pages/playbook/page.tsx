import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/playbook/")({
  beforeLoad: () => {
    throw redirect({ to: "/playbook/$slug", params: { slug: "overview" }, replace: true });
  },
});
