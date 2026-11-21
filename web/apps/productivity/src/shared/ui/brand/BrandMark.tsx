/**
 * cowork의 심벌: 열린 C 아크와 협업 스파크(함께 일하는 공간과 에이전트). 글자 색으로 그려 테마와 모드를 따른다.
 * 정사각형이고 size가 한 변이다. label을 비우면 옆에 선 것(이름을 적은 로고)에 맡긴다.
 */
export function BrandMark({ size = '1.5rem', label = 'cowork' }: { size?: string; label?: string }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} fill="currentColor">
    <path d="M46.6 48.6A23.5 23.5 0 1 1 46.6 15.4L38.8 23.2A12.5 12.5 0 1 0 38.8 40.8Z" />
    <path d="M48 22C48 28.4 51.6 32 58 32C51.6 32 48 35.6 48 42C48 35.6 44.4 32 38 32C44.4 32 48 28.4 48 22Z" />
  </svg>;
}
