import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/entities/session";
import { AccountsShell } from "./ui/AccountsShell";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { next: undefined } });
    }
    if (!user.onboarded) {
      throw redirect({ to: "/onboarding", search: { next: undefined } });
    }
    return { user };
  },
  component: SignedInLayout,
});

function SignedInLayout() {
  const { user } = Route.useRouteContext();
  return (
    <AccountsShell user={user}>
      <Outlet />
    </AccountsShell>
  );
}
