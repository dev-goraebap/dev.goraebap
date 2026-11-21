import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "./ui/OnboardingPage";

interface OnboardingSearch {
  next?: string;
}

export const Route = createFileRoute("/onboarding/")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const { next } = Route.useSearch();
  return <OnboardingPage next={next} />;
}
