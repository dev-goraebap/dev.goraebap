import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootPage,
});

function RootPage() {
  return <Outlet />;
}
