export type ThemeName = "app" | "editorial" | "ocean" | "forest" | "terracotta";
export type ColorMode = "light" | "dark";

export function applyTheme(theme: ThemeName, target: HTMLElement = document.documentElement) {
  target.setAttribute("data-ds-theme", theme);
}

export function applyColorMode(mode: ColorMode, target: HTMLElement = document.documentElement) {
  target.classList.toggle("dark", mode === "dark");
}
