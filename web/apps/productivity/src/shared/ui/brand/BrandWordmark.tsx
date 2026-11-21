import { BrandMark } from './BrandMark';

/** 로그인 같은 넓은 자리의 이름표: 심벌과 이름. */
export function BrandWordmark({ width = '15rem' }: { width?: string }) {
  // check-ui: allow-style 넓이는 부르는 쪽이 정하는 값이다.
  return <span role="img" aria-label="cowork" className="flex max-w-full items-center gap-3 font-semibold tracking-tight" style={{ width }}>
    <BrandMark size="2.5rem" label="" />
    <span aria-hidden className="text-4xl leading-none">cowork</span>
  </span>;
}
