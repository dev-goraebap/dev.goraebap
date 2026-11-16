/**
 * 제출 검사에서 빠진 칸으로 초점을 옮긴다. 제출 버튼은 막지 않고, 누르면 빠진 칸에 aria-invalid와 곁의 설명을 붙인 뒤
 * 이 함수로 첫 칸에 초점을 둔다. 표시가 그려진 다음 프레임에 찾는다.
 */
export function focusFirstInvalid(root: ParentNode = document) {
  requestAnimationFrame(() => {
    root.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  })
}
