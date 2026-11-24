import type { Routes } from "@angular/router";

// 주소 하나가 pages 아래 폴더 하나다. 폴더마다 routes.ts가 그 주소와 아래 주소를 정한다.
export const routes: Routes = [
  { path: "login", loadChildren: () => import("@/pages/login/routes") },
  { path: "onboarding", loadChildren: () => import("@/pages/onboarding/routes") },
  { path: "", loadChildren: () => import("@/pages/account/routes") },
  { path: "**", redirectTo: "" },
];
