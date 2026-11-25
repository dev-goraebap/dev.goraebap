import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/backend/engineering/")({
  beforeLoad: () => {
    throw redirect({
      to: "/backend/engineering/$slug",
      params: { slug: "overview" },
      replace: true,
    });
  },
});
