import type { Approver, LeaveKind, LeaveSlot, SpecialTypeId } from "@/entities/leave"

/** 새 신청이 무엇을 신청하는지(호호코워크 RequestKind). 주소(/leaves/new?kind=annual)에 남아 뒤로 가기가 고르기로 돌아간다. */
export type RequestKind = "annual" | "special"

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const SPECIAL_IDS: readonly string[] = ["reward", "substitute", "sick", "family"] satisfies SpecialTypeId[]

/** 새 신청의 주소: 종류(없으면 고르기), 특별휴가의 종류, 첫날(일정의 그날에서 열 때). */
export type NewRequestSearch = { kind?: RequestKind; type?: SpecialTypeId; date?: string }

export function parseNewRequestSearch(raw: Record<string, unknown>): NewRequestSearch {
  const search: NewRequestSearch = {}
  if (raw.kind === "annual" || raw.kind === "special") search.kind = raw.kind
  if (typeof raw.type === "string" && SPECIAL_IDS.includes(raw.type)) search.type = raw.type as SpecialTypeId
  if (typeof raw.date === "string" && DATE.test(raw.date)) search.date = raw.date
  return search
}

/** 첫 단계에서 고르는 것: 하루 중 얼마(구분), 날짜, 종일이 아니면 칸. 특별휴가는 종류도. */
export type DateDraft = { kind: LeaveKind; start?: string; end?: string; slot?: LeaveSlot }
export type SpecialDraft = DateDraft & { typeId?: SpecialTypeId }

export const STEPS = ["휴가 정보", "결재선", "확인"] as const

/** 이름의 받침: 조사(은/는, 이/가)를 고른다. 숫자는 한자어로 읽는다(3은 삼). */
export function hasFinal(word: string) {
  const last = word.at(-1) ?? ""
  if (/\d/.test(last)) return "013678".includes(last)
  const code = last.charCodeAt(0) - 0xac00
  return code >= 0 && code < 11172 && code % 28 !== 0
}

/** 결재선이 처음 것과 다른지: 결재자에게 "결재선을 바꿔 신청"이 함께 보인다. */
export const lineChanged = (line: readonly Approver[], suggested: readonly Approver[]) =>
  line.map(person => person.id).join() !== suggested.map(person => person.id).join()

/** 결재선에 둘 수 있는 사람 수(호호코워크 MAX_APPROVERS). */
export const MAX_APPROVERS = 3
