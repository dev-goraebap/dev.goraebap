import type { TokenValues } from "../model/token-sets";

const SENTINEL = "#010203";
let context: CanvasRenderingContext2D | null = null;

function getContext() {
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true });
  }
  return context;
}

// 토큰 값 안의 var()를 같은 세트의 값으로 풀어 표 밖에서도 그대로 칠할 수 있게 한다.
export function substituteVars(value: string, values: TokenValues, depth = 0): string {
  if (depth > 6) return value;
  return value.replace(/var\((--[\w-]+)\)/g, (match, name: string) =>
    name in values ? substituteVars(values[name], values, depth + 1) : match,
  );
}

const hexPart = (channel: number) => channel.toString(16).padStart(2, "0");

export function toHexColor(value: string) {
  const ctx = getContext();
  if (!ctx) return value;
  ctx.fillStyle = SENTINEL;
  ctx.fillStyle = value;
  if (ctx.fillStyle === SENTINEL && value.toLowerCase() !== SENTINEL) return value;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = `#${hexPart(red)}${hexPart(green)}${hexPart(blue)}`;
  return alpha === 255 ? hex : `${hex}${hexPart(alpha)}`;
}
