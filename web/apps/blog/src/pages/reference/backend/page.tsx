import { createFileRoute, redirect } from "@tanstack/react-router";
import { stackRedirect } from "@/entities/content-doc";
import { firstDocOf } from "./lib/section";

// Backend Reference에는 섹션 바로 아래 문서(개요)가 없어 첫 묶음의 첫 문서로 보낸다.
export const Route = createFileRoute("/reference/backend/")({
  beforeLoad: () => {
    const first = firstDocOf("structure");
    if (first) throw stackRedirect(first.menu, first.slug);
    throw redirect({ href: "/", replace: true });
  },
});
