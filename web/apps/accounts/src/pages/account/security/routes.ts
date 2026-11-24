import type { Routes } from "@angular/router";
import { SecurityPage } from "./ui/security-page";

export default [
  { path: "", component: SecurityPage, title: "보안 · goraebap accounts" },
] satisfies Routes;
