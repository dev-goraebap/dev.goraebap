/** 보고의 id: 그 주의 월요일과 쓴 사람(2026-11-09-person-1). 주소에 그대로 쓸 수 있는 글자만 쓴다. */
export const reportIdOf = (weekStart: string, memberId: string) => `${weekStart}-${memberId}`

/** 보고 하나의 페이지(/weekly-reports/{id}). */
export const weeklyReportHref = (id: string) => `/weekly-reports/${encodeURIComponent(id)}`

/**
 * 한 주의 내 보고를 쓰는 페이지(/weekly-reports/write/{월요일}). returnTo는 끝나거나 취소하면 돌아갈 보고의 주소다
 * (보고에서 고치기로 왔을 때).
 */
export function weeklyReportWriteHref(weekStart: string, returnTo?: string) {
  const path = `/weekly-reports/write/${weekStart}`
  return returnTo ? `${path}?${new URLSearchParams({ returnTo })}` : path
}
