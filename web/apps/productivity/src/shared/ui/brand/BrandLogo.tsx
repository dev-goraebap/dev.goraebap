import { BrandMark } from './BrandMark';
import { BrandWordmark } from './BrandWordmark';

/** 펼친 메뉴에는 워드마크, 접힌 메뉴에는 정사각형 심벌을 표시한다. */
export function BrandLogo({ isMarkOnly = false }: { isMarkOnly?: boolean }) {
  return isMarkOnly ? <BrandMark /> : <BrandWordmark width="10rem" />;
}
