export type CropArea = { x: number; y: number; width: number; height: number }

const SIDE = 512

/**
 * 고른 영역을 512px 정사각 JPEG로 잘라 data URL로 돌려준다(호호코워크 crop-picture). 원본은 브라우저에 두고 이것만 남긴다.
 * 투명한 PNG가 검게 되지 않도록 흰 바탕에 그린다. 서버가 없어 업로드 대신 data URL이다: 내 정보와 함께 이 브라우저에 남아 새로고침에도 보인다.
 */
export async function cropPicture(source: string, area: CropArea): Promise<string> {
  const image = new Image()
  image.src = source
  await image.decode()
  const canvas = document.createElement("canvas")
  canvas.width = SIDE
  canvas.height = SIDE
  const context = canvas.getContext("2d")
  if (!context) throw new Error("사진을 자르지 못했습니다.")
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, SIDE, SIDE)
  context.imageSmoothingQuality = "high"
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, SIDE, SIDE)
  const picture = canvas.toDataURL("image/jpeg", 0.9)
  // 호호코워크 서버의 한도(1 MB). data URL은 base64라 바이트의 약 4/3이다.
  if (picture.length * 0.75 > 1024 * 1024) throw new Error("사진은 1 MB 이하로 올려 주세요.")
  return picture
}
