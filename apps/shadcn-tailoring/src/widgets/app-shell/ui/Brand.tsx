import { BrandMark, BrandWordmark } from "@/shared/ui/brand"

/** 제품 로고: 펼친 사이드바는 워드마크(10rem), 접힌 사이드바는 정사각형 심벌. 글자색을 따른다. */
export function Brand({ isFolded }: { isFolded?: boolean }) {
  return isFolded ? <BrandMark /> : <BrandWordmark width="10rem" />
}
