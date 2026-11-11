import { useSyncExternalStore } from "react"

/**
 * 화면 설정(호호코워크 shared/lib/appearance): 모드와 목록 높이. 고르면 바로 바뀌고 이 브라우저에만 남는다.
 * 모드는 html의 .dark, 목록 높이는 html의 data-density로 CSS가 읽는다.
 */
export type Mode = "system" | "light" | "dark"
export type Density = "spacious" | "compact"
export type Appearance = { mode: Mode; density: Density }

const KEY = "cowork-appearance"
const DEFAULT: Appearance = { mode: "system", density: "spacious" }
const listeners = new Set<() => void>()
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)")

function read(): Appearance {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }
  } catch {
    return DEFAULT
  }
}

let current = typeof window === "undefined" ? DEFAULT : read()

/** html에 지금 설정을 반영한다. 앱이 시작할 때 한 번, 바꿀 때마다 부른다. */
export function applyAppearance() {
  const isDark = current.mode === "dark" || (current.mode === "system" && darkQuery().matches)
  document.documentElement.classList.toggle("dark", isDark)
  document.documentElement.dataset.density = current.density
}

export function setAppearance(change: Partial<Appearance>) {
  current = { ...current, ...change }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // 저장할 수 없어도 이번 화면에는 반영한다.
  }
  applyAppearance()
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  const query = darkQuery()
  const onSystem = () => { if (current.mode === "system") applyAppearance() }
  query.addEventListener("change", onSystem)
  return () => { listeners.delete(listener); query.removeEventListener("change", onSystem) }
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT)
}
