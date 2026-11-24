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

const hexPart = (channel: number) => channel.toString(16).padStart(2, "0");

// color-mix()나 oklch()처럼 다른 도구가 읽지 못하는 색을 브라우저로 칠해 hex로 바꾼다.
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
