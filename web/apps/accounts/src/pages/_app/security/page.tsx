import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "./ui/SecurityPage";

export const Route = createFileRoute("/_app/security/")({
  component: SecurityRoute,
});

function SecurityRoute() {
  const { user } = Route.useRouteContext();
  return <SecurityPage user={user} />;
}
