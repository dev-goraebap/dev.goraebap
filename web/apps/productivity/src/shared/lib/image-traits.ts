/** What an upload tells about a picture so screens can hold its place: its main colour and its size in pixels. */
export type ImageTraits = { dominantColor?: string; width?: number; height?: number };

/** The side the picture is shrunk to before its colour is read; enough for the colour, cheap for the browser. */
const SAMPLE = 64;
/**
 * How long one picture may take to measure. A browser does not decode while the page is hidden, so decode() can wait
 * until the tab comes back; past this the picture goes up without its traits.
 */
const MEASURE_TIMEOUT_MS = 3000;
/** The largest side the server keeps (ImageTraits.MAX_SIDE on the server); a bigger one is sent without its size. */
const MAX_SIDE = 1_000_000;
const PICTURE = /^image\/(png|jpeg|webp|gif)$/;
const measured = new WeakMap<Blob, Promise<ImageTraits>>();
// One picture at a time, so choosing many photos does not decode them all at once.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Measures a picture before it is sent (client-v1의 image-traits를 옮겼다). A file that is not a picture, one the browser
 * cannot read, or one that takes longer than MEASURE_TIMEOUT_MS measures as nothing: the upload goes ahead and the
 * screen paints a plain placeholder.
 */
export function measureImage(file: Blob): Promise<ImageTraits> {
  if (!PICTURE.test(file.type)) return Promise.resolve({});
  const known = measured.get(file);
  if (known) return known;
  const result = queue.then(() => {
    const stop = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<ImageTraits>(resolve => { timer = setTimeout(() => { stop.abort(); resolve({}); }, MEASURE_TIMEOUT_MS); });
    return Promise.race([measure(file, stop.signal), late]).finally(() => clearTimeout(timer));
  });
  queue = result;
  measured.set(file, result);
  return result;
}

async function measure(file: Blob, signal: AbortSignal): Promise<ImageTraits> {
  const traits: ImageTraits = {};
  const url = URL.createObjectURL(file);
  const image = new Image();
  // Dropping the source makes a pending decode() reject, so a picture that ran out of time lets its memory go.
  const release = () => { image.src = ''; URL.revokeObjectURL(url); };
  signal.addEventListener('abort', release, { once: true });
  try {
    image.src = url;
    await image.decode();
    if (signal.aborted) return {};
    if (image.naturalWidth <= MAX_SIDE && image.naturalHeight <= MAX_SIDE) {
      traits.width = image.naturalWidth;
      traits.height = image.naturalHeight;
    }
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context?.drawImage(image, 0, 0, SAMPLE, SAMPLE);
    const color = context ? dominantOf(context.getImageData(0, 0, SAMPLE, SAMPLE).data) : undefined;
    if (color) traits.dominantColor = color;
  } catch {
    // A picture that cannot be measured is still sent as it is.
  } finally {
    signal.removeEventListener('abort', release);
    if (!signal.aborted) release();
  }
  return traits;
}

/**
 * The picture's main colour: its pixels counted in coarse buckets (4 bits a channel, transparent ones left out), and the
 * average of the fullest bucket. Not the plain average, which turns a photo of two strong colours into a muddy third.
 */
function dominantOf(pixels: Uint8ClampedArray): string | undefined {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3]! < 128) continue;
    const r = pixels[index]!, g = pixels[index + 1]!, b = pixels[index + 2]!;
    const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b;
    buckets.set(key, bucket);
  }
  let best: { count: number; r: number; g: number; b: number } | undefined;
  for (const bucket of buckets.values()) if (!best || bucket.count > best.count) best = bucket;
  if (!best) return undefined;
  const hex = (sum: number) => Math.round(sum / best.count).toString(16).padStart(2, '0');
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

/** Pictures this page has already shown, by address: they come back at once. */
const arrived = new Set<string>();
/** Notes that a picture has arrived, so it shows at once wherever it appears again. */
export function noteImageArrived(src: string) {
  arrived.add(src);
}
/**
 * Whether a picture is at hand without waiting: shown before on this page, or already in the browser's cache. A screen
 * shows such a picture at once and fades in only one it has to fetch.
 */
export function isImageAtHand(src: string | undefined): boolean {
  if (!src) return false;
  if (arrived.has(src)) return true;
  if (typeof Image === 'undefined') return false;
  const probe = new Image();
  probe.src = src;
  return probe.complete && probe.naturalWidth > 0;
}
