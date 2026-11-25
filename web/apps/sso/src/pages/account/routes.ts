import type { Routes } from "@angular/router";
import { signedIn } from "@/entities/session";
import { AccountShell } from "./ui/account-shell";

// 로그인한 사람의 계정 화면. 이 폴더가 셸과 가드를 맡고, 아래 폴더가 각 주소의 화면을 맡는다.
export default [
  {
    path: "",
    canActivate: [signedIn],
    component: AccountShell,
    children: [
      { path: "", loadChildren: () => import("./home/routes") },
      { path: "profile", loadChildren: () => import("./profile/routes") },
      { path: "security", loadChildren: () => import("./security/routes") },
    ],
  },
] satisfies Routes;
