import type { TokenValues } from "../model/token-sets";

// 토큰 값 안의 var()를 같은 세트의 값으로 풀어 표 밖에서도 그대로 칠할 수 있게 한다.
export function substituteVars(value: string, values: TokenValues, depth = 0): string {
  if (depth > 6) return value;
  return value.replace(/var\((--[\w-]+)\)/g, (match, name: string) =>
    name in values ? substituteVars(values[name], values, depth + 1) : match,
  );
}
