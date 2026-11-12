import { MB } from "@/shared/ui/compose"

/** 받는 사진 형식(호호코워크와 같다). 캔버스가 그릴 수 있는 것만 받는다. */
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif"
/** 원본의 한도. 원본은 브라우저 안에서만 쓰고 잘라 낸 512px만 남기므로 넉넉하다. */
export const PHOTO_MAX_BYTES = 20 * MB
/** 가로나 세로가 이보다 크면 디코딩에 메모리를 너무 쓴다. */
const MAX_SIDE = 20000

/**
 * 고른 파일을 자르개가 읽을 object URL로 연다. 형식 · 크기 · 실제로 열리는지를 보고, 안 되면 보여 줄 말로 throw한다.
 * 받은 주소는 부르는 쪽이 다 쓰면 URL.revokeObjectURL로 놓는다.
 */
export async function openPhoto(file: File) {
  if (!PHOTO_ACCEPT.split(",").includes(file.type)) throw new Error("JPEG, PNG, WebP, GIF 사진을 골라 주세요.")
  if (file.size > PHOTO_MAX_BYTES) throw new Error("20 MB 이하 사진을 골라 주세요.")
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (image.naturalWidth > MAX_SIDE || image.naturalHeight > MAX_SIDE) throw new Error("사진 크기가 너무 큽니다.")
    return url
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error instanceof Error && error.message === "사진 크기가 너무 큽니다." ? error : new Error("사진 파일을 열지 못했습니다. 다른 사진을 골라 주세요.")
  }
}
