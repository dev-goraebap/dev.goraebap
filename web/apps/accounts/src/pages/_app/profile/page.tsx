import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "./ui/ProfilePage";

export const Route = createFileRoute("/_app/profile/")({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { user } = Route.useRouteContext();
  return <ProfilePage user={user} />;
}
