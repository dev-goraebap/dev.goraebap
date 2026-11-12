import type { ReactNode } from "react"
import type { Icon } from "@/shared/ui/icon"

/**
 * 메뉴의 목적지 하나. children은 펼치는 아래 줄(별표한 프로젝트 · 저장한 뷰 · 문서 묶음)이며 몇 단계든 된다.
 * 같은 주소의 다른 뷰(?view=)처럼 주소만으로 지금 자리를 가릴 수 없으면 isCurrent로 직접 정한다.
 */
export type NavEntry = {
  path: string
  /** 같은 페이지의 다른 조건(?view=). 링크에 붙고, 지금 자리 판단에는 쓰지 않는다. */
  search?: Record<string, string>
  label: string
  /** 아래 줄은 아이콘을 생략할 수 있다(위 항목 아래에 들여 쓴다). */
  icon?: Icon
  /** 아이콘 대신 그릴 것(프로젝트 표식). */
  media?: ReactNode
  /** 옆의 수(읽지 않은 알림). 99를 넘으면 99+. */
  badge?: number
  isDisabled?: boolean
  /** 지금 자리를 직접 정한다. 없으면 주소의 가장 긴 접두사로 찾는다. */
  isCurrent?: boolean
  /** 휴대폰 하단 탭 · 더보기에 넣지 않는다(앱 바 도구가 같은 곳을 연다: 알림함). */
  isPhoneHidden?: boolean
  children?: NavEntry[]
}

/** 이름 있는 묶음. 첫 묶음처럼 이름이 필요 없으면 isHeaderHidden. */
export type NavSection = { title: string; isHeaderHidden?: boolean; entries: NavEntry[] }

/**
 * 화면에 보이는 메뉴 한 벌. 주 메뉴, 또는 주 메뉴에서 연 하위 공간(내 계정 · 프로젝트 · 관리)이 주 메뉴를 대체하고
 * back으로 돌아간다. 어느 공간인지는 앱이 주소로 정해 넘긴다.
 */
export type NavSpace = { id: string; title: string; back?: { label: string; path: string }; sections: NavSection[] }

/** 공간의 최상위 항목들(묶음 순서대로). */
export const entriesOf = (space: NavSpace) => space.sections.flatMap(section => section.entries)

/** 모든 단계의 항목을 위에서부터 한 줄로. */
export const flattenEntries = (list: readonly NavEntry[]): NavEntry[] => list.flatMap(entry => [entry, ...flattenEntries(entry.children ?? [])])

const baseOf = (path: string) => path.split("?")[0]

/**
 * 주소에 해당하는 항목: isCurrent를 정한 항목은 그것을 따르고, 나머지는 항목 주소이거나 그 아래인 것 중 가장 긴 것.
 * 같은 주소의 뷰 줄(search가 있는 줄)은 접두사 판단에서 빼 위 항목이 지금 자리가 된다.
 */
export function currentEntry(space: NavSpace, pathname: string): NavEntry | undefined {
  const all = flattenEntries(entriesOf(space))
  const chosen = all.find(entry => entry.isCurrent)
  if (chosen) return chosen
  return all
    .filter(entry => entry.isCurrent === undefined && !entry.search)
    .filter(entry => pathname === baseOf(entry.path) || pathname.startsWith(`${baseOf(entry.path)}/`))
    .sort((a, b) => baseOf(b.path).length - baseOf(a.path).length)[0]
}

/** entry나 그 아래 어딘가가 target인지. 위 항목을 함께 칠하고, 탭이 지금 자리인지 볼 때 쓴다. */
export const contains = (entry: NavEntry, target: NavEntry | undefined): boolean =>
  !!target && (entry === target || (entry.children ?? []).some(child => contains(child, target)))

/** 휴대폰 탭과 더보기에 둘 수 있는 최상위 항목. */
export const phoneEntriesOf = (space: NavSpace) => entriesOf(space).filter(entry => !entry.isPhoneHidden)

export const badgeText = (count: number) => (count > 99 ? "99+" : String(count))

/**
 * 메뉴 링크의 activeOptions. TanStack Link는 기본으로 주소의 접두사가 같으면 스스로 aria-current="page"를 단다. 그러면 위 항목과
 * 지금 항목이 함께 "지금 페이지"로 읽히므로, 링크는 주소와 검색 값이 똑같을 때만 스스로 달고 나머지는 셸이 정한다.
 */
export const EXACT_LINK = { exact: true, includeSearch: true } as const
