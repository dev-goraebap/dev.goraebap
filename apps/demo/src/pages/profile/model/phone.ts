/** 숫자만 남긴다. */
const digits = (value: string) => value.replace(/\D/g, "").slice(0, 11)

/** 0으로 시작하는 9~11자리 번호인지(호호코워크 shared/lib/phone). */
export const isPhone = (value: string) => /^0\d{8,10}$/.test(digits(value))

/** 입력 중에도 하이픈을 정해진 자리에 넣는다: 02-123-4567, 010-1234-5678. */
export function formatPhone(value: string) {
  const number = digits(value)
  const head = number.startsWith("02") ? 2 : 3
  if (number.length <= head) return number
  const body = number.slice(head)
  // 끝 넷이 마지막 칸, 그 앞이 가운데 칸. 넷 이하일 때는 아직 가운데 칸만 있다.
  const parts = body.length > 4 ? [body.slice(0, -4), body.slice(-4)] : [body]
  return [number.slice(0, head), ...parts].join("-")
}
