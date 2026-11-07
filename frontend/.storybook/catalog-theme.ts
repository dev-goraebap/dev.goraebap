import { create } from "storybook/theming";

export type CatalogMode = "light" | "dark";
export const catalogThemes = {
  light: create({ base: "light", brandTitle: "고래밥 워크플로우 · 화면 패턴" }),
  dark: create({ base: "dark", brandTitle: "고래밥 워크플로우 · 화면 패턴" }),
};
export function catalogMode(value: unknown): CatalogMode {
  return value === "dark" ? "dark" : "light";
}
// 새로고침 시에도 Storybook이 주소에 보관한 전역 선택을 따른다.
export function initialCatalogMode(): CatalogMode {
  const globals = new URLSearchParams(window.location.search).get("globals");
  return globals?.split(";").includes("theme:dark") ? "dark" : "light";
}
