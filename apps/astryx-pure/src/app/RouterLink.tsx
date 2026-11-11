import { Link } from '@tanstack/react-router';
import { forwardRef, type AnchorHTMLAttributes } from 'react';

/** Astryx가 그리는 링크를 라우터로 잇는다. 앱 안 주소(/로 시작)는 라우터 Link, 나머지는 보통 a. */
export const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function RouterLink({ href, ...rest }, ref) {
  return href?.startsWith('/') ? <Link ref={ref} to={href} {...rest} /> : <a ref={ref} href={href} {...rest} />;
});
