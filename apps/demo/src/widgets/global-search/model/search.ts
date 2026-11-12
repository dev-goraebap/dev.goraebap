import { useEffect, useState, type ReactNode } from "react"
import type { Icon } from "@/shared/ui/icon"

/** 검색이 찾는 곳 하나: 이름, 자리(오른쪽 보조 글자), 표식(아이콘, 사람 · 프로젝트는 그림), 주소. */
export type SearchHit = { id: string; label: string; where?: string; href: string; icon: Icon; media?: ReactNode }

/**
 * 검색이 보는 출처 하나(페이지 · 업무 · 공지 · 회의록 · 사람 · 프로젝트): 결과 묶음의 제목과 찾을 후보.
 * 지금은 모의 데이터를 이 브라우저에서 거른다. 서버 검색이 생기면 후보 대신 서버의 답을 같은 자리에 둔다.
 */
export type SearchSource = { id: string; title: string; hits: readonly SearchHit[]; isLoading?: boolean }

/** 입력이 wait(ms) 멈춘 뒤의 값. 지울 때는 바로 따른다. */
export function useSettled(value: string, wait = 200) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), value.trim() ? wait : 0)
    return () => window.clearTimeout(timer)
  }, [value, wait])
  return settled
}

/** 이름이 검색어의 낱말을 모두 품는지(대소문자 · 띄어쓰기 무시: "업무 보고"가 주간보고 · 업무를 함께 찾는다). */
export function matches(text: string, words: string) {
  const plain = text.toLowerCase().replace(/\s+/g, "")
  return words.toLowerCase().split(/\s+/).filter(Boolean).every(word => plain.includes(word))
}

/** 출처마다 검색어에 맞는 것(출처 순서대로, 맞는 것이 없는 출처는 뺀다). */
export function findIn(sources: readonly SearchSource[], words: string) {
  if (!words.trim()) return []
  return sources
    .map(source => ({ source, hits: source.hits.filter(hit => matches(`${hit.label} ${hit.where ?? ""}`, words)) }))
    .filter(group => group.hits.length > 0)
}

const RECENT_KEY = "shadcn-tailoring-recent-searches"
const RECENT_MAX = 6

function readRecent(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(saved) ? saved.filter((each): each is string => typeof each === "string") : []
  } catch {
    return []
  }
}

/** 이 브라우저의 최근 검색(어딘가로 간 검색어, 최근 것부터 6개). 아무것도 적기 전에 다시 권한다. */
export function useRecentSearches() {
  const [recent, setRecent] = useState(readRecent)
  const keep = (next: string[]) => {
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      // 저장할 수 없어도 이번 화면에는 남는다.
    }
  }
  return {
    recent,
    add: (words: string) => {
      const trimmed = words.trim()
      if (trimmed) keep([trimmed, ...recent.filter(each => each !== trimmed)].slice(0, RECENT_MAX))
    },
    remove: (words: string) => keep(recent.filter(each => each !== words)),
    clear: () => keep([]),
  }
}
