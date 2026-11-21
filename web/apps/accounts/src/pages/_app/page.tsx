import { createFileRoute } from "@tanstack/react-router";
import { AccountHubPage } from "./ui/AccountHubPage";

export const Route = createFileRoute("/_app/")({
  component: AccountHubRoute,
});

function AccountHubRoute() {
  const { user } = Route.useRouteContext();
  return <AccountHubPage user={user} />;
}
