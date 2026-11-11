/** 목록이 읽는 날짜: 2026-10-22 → 10월 22일. 올해가 아니면 연도를 붙인다. */
export function formatWorkItemDate(date: string, today = new Date()) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number)
  const short = `${month}월 ${day}일`
  return year === today.getFullYear() ? short : `${year}년 ${short}`
}
