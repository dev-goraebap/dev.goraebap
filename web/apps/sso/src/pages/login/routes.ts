import type { Routes } from "@angular/router";
import { signedOut } from "@/entities/session";
import { LoginPage } from "./ui/login-page";

export default [
  { path: "", canActivate: [signedOut], component: LoginPage, title: "로그인 · goraebap sso" },
] satisfies Routes;
