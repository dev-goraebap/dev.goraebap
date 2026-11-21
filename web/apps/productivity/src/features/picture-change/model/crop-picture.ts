export type CropArea = { x: number; y: number; width: number; height: number };

/** The avatar service accepts one 512-square JPEG; originals stay in the browser. */
export async function cropPicture(source: string, area: CropArea): Promise<Blob> {
  const image = new Image(); image.src = source; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('사진을 자르지 못했습니다.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, 512, 512); context.imageSmoothingQuality = 'high';
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('사진을 자르지 못했습니다.')), 'image/jpeg', 0.9));
}
