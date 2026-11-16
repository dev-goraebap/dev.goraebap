import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

type Search = Record<string, unknown>

/*
 * 목록의 확정 조건(찾는 말 · 필터 · 표시)은 주소가 가진다. 바꿀 때는 기록을 쌓지 않고(replace) 지금 주소를 고쳐,
 * 뒤로 가기 · 새로고침 · 공유한 링크에서 같은 목록이 돌아온다. 다른 검색 값은 그대로 두고, 기본값과 같은 값은 주소에서 뺀다.
 * 접기 · 고른 줄 같은 화면 상태는 주소에 두지 않는다.
 */

/** 주소의 검색 값을 고친다. undefined · 빈 값은 뺀다. */
export function useAddressWriter() {
  const navigate = useNavigate()
  const router = useRouter()
  return (changes: Record<string, string | undefined>) => {
    // 한 이벤트에서 여러 번 고쳐도 앞의 변경을 덮지 않도록 부를 때의 주소를 읽는다.
    const location = router.state.location
    const current = location.search as Search
    const next: Search = { ...current }
    for (const [key, value] of Object.entries(changes)) {
      if (value) next[key] = value
      else delete next[key]
    }
    if (JSON.stringify(next) === JSON.stringify(current)) return
    void navigate({ to: location.pathname, search: next as never, replace: true })
  }
}

/** 주소의 값을 글자로(숫자처럼 읽힌 값도). */
const text = (value: unknown) => (value === undefined || value === null ? "" : String(value))

/**
 * 필터 값: 키마다 쉼표로 이은 값(?status=todo,doing). 선택지가 아직 오지 않았을 수 있어 적힌 대로 읽는다.
 * useFilters(defs, { state, onStateChange })에 그대로 넘긴다.
 */
export function useAddressFilters<K extends string>(keys: readonly K[]): [Partial<Record<K, string[]>>, (next: Partial<Record<K, string[]>>) => void] {
  const search = useLocation().search as Search
  const write = useAddressWriter()
  const state: Partial<Record<K, string[]>> = {}
  for (const key of keys) {
    const values = text(search[key]).split(",").filter(Boolean)
    if (values.length) state[key] = values
  }
  return [state, next => write(Object.fromEntries(keys.map(key => [key, (next[key] ?? []).join(",") || undefined])))]
}

/** 찾는 말(?q=): 칸은 입력을 바로 보이고 주소는 300ms 뒤 따라간다(입력하는 동안 주소를 고치지 않는다). */
export function useAddressWords(key = "q"): [string, (words: string) => void] {
  const search = useLocation().search as Search
  const inAddress = text(search[key])
  const [words, setWords] = useState(inAddress)
  const write = useAddressWriter()
  const latest = useRef(write)
  latest.current = write
  const typed = useRef(inAddress)
  // 뒤로 가기처럼 주소가 바뀌면 칸도 따른다.
  useEffect(() => {
    if (inAddress === typed.current) return
    typed.current = inAddress
    setWords(inAddress)
  }, [inAddress])
  useEffect(() => {
    if (words === typed.current) return undefined
    const timer = setTimeout(() => {
      typed.current = words.trim()
      latest.current({ [key]: words.trim() || undefined })
    }, 300)
    return () => clearTimeout(timer)
  }, [key, words])
  return [words, setWords]
}

/**
 * 표시(보기 · 정렬 · 방향 · 그룹처럼 하나를 고르는 묶음): 키마다 허용한 값만 읽고, 기본(initial)과 다른 값만 주소에 둔다.
 *   const [display, setDisplay] = useAddressChoices({ sort: "updated", direction: "desc" }, { sort: ["updated", "title"], direction: ["desc", "asc"] })
 */
export function useAddressChoices<T extends Record<string, string>>(initial: T, allowed: { [K in keyof T]: readonly T[K][] }): [T, (next: T) => void] {
  const search = useLocation().search as Search
  const write = useAddressWriter()
  const value = Object.fromEntries(Object.keys(initial).map(key => {
    const raw = text(search[key])
    return [key, (allowed[key] as readonly string[]).includes(raw) ? raw : initial[key]]
  })) as T
  return [value, next => write(Object.fromEntries(Object.keys(initial).map(key => [key, next[key] === initial[key] ? undefined : next[key]])))]
}
