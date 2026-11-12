/** 카드 · 줄에 보일 본문 앞부분: Markdown 표시를 걷어 낸 첫 몇 문장. */
export function excerptOf(body: string, length = 140) {
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .split("\n")
    .map(line => line.replace(/^\s*(?:#{1,6}|[-*>]|\d+\.)\s*/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\*\*|`/g, "")
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text
}

/** 본문의 소제목(# · ## 는 2단계, ### 는 3단계). 읽기 본문의 목차가 쓴다. */
export function headingsOf(body: string) {
  const headings: { level: 2 | 3; text: string }[] = []
  let isCode = false
  for (const line of body.split("\n")) {
    if (/^```/.test(line)) isCode = !isCode
    const match = !isCode && /^(#{1,3})\s+(.*)$/.exec(line)
    if (match) headings.push({ level: match[1].length === 3 ? 3 : 2, text: match[2].replace(/\*\*|`/g, "") })
  }
  return headings
}

const shortDay = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })
const fullDay = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" })

/** 카드의 날짜: 11월 3일. */
export const cardDateText = (iso: string) => shortDay.format(new Date(iso))
/** 상세 정보의 날짜: 2026년 11월 3일. */
export const fullDateText = (iso: string) => fullDay.format(new Date(iso))
