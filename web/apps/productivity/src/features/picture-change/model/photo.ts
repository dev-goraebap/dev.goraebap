/** The formats a canvas can draw, which is all the cropper takes. */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
/** The original stays in the browser and only the 512px crop is sent, so it may be large. */
const PHOTO_MAX_BYTES = 20 * 1024 * 1024;
/** Past this on either side decoding takes too much memory. */
const MAX_SIDE = 20000;
const TOO_LARGE = '사진 크기가 너무 큽니다.';

/**
 * Opens a chosen file as an object URL for the cropper, after checking its format, size and that it decodes; a problem
 * throws with the words to show. The caller lets the URL go (URL.revokeObjectURL) when it is done with it.
 */
export async function openPhoto(file: File): Promise<string> {
  if (!PHOTO_ACCEPT.split(',').includes(file.type)) throw new Error('JPEG, PNG, WebP, GIF 사진을 골라 주세요.');
  if (file.size > PHOTO_MAX_BYTES) throw new Error('20MB 이하 사진을 골라 주세요.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth > MAX_SIDE || image.naturalHeight > MAX_SIDE) throw new Error(TOO_LARGE);
    return url;
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error instanceof Error && error.message === TOO_LARGE ? error : new Error('사진 파일을 열지 못했습니다. 다른 사진을 골라 주세요.');
  }
}
