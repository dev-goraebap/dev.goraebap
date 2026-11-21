import { useRef } from 'react';

/**
 * 시트 · 대화상자가 닫히는 동안 보일 내용. 닫을 때 내용을 바로 비우면(선택을 null로) 시트가 빈 채로 줄어들어 내려가는 움직임 없이
 * 훅 사라진다. 열려 있는 동안은 지금 값을, 닫힌 뒤(값이 없을 때)는 마지막 값을 돌려준다. 다음에 열면 새 값으로 바뀐다.
 */
export function useClosingValue<T>(value: T | null | undefined): T | null | undefined {
  const last = useRef(value);
  if (value !== null && value !== undefined) last.current = value;
  return value ?? last.current;
}
