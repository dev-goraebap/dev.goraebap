const KEY = (space: string) => `goraebap-stack-${space}`;

// 고른 스택을 기억해 스택 없는 주소로 들어와도 같은 스택으로 연다. 저장하지 못하면 첫 스택을 쓴다.
export function storedStack(space: string, stacks: readonly string[]) {
  if (typeof window === "undefined") return stacks[0];
  try {
    const stored = window.localStorage.getItem(KEY(space));
    return stored && stacks.includes(stored) ? stored : stacks[0];
  } catch {
    return stacks[0];
  }
}

export function rememberStack(space: string, stack: string) {
  try {
    window.localStorage.setItem(KEY(space), stack);
  } catch {
    // 저장하지 못해도 주소가 스택을 가진다.
  }
}
