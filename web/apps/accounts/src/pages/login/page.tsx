import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "./ui/LoginPage";

interface LoginSearch {
  next?: string;
}

export const Route = createFileRoute("/login/")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { next } = Route.useSearch();
  return <LoginPage next={next} />;
}
