/**
 * 사이트의 고정 주소. 라우터는 문서 주소를 모두 한 갈래($)로 받으므로(app/main.tsx) 주소 글자를 라우트 타입으로 좁히지 않고
 * string으로 둔다. TanStack Link의 to에 글자 그대로 쓰면 타입이 "/$/"만 받는다.
 */
type SitePath = 'blog' | 'appearance' | 'plugins' | 'projectLink';
export const paths: Record<SitePath, string> = {
  blog: '/blog/',
  appearance: '/settings/appearance/',
  plugins: '/settings/plugins/',
  projectLink: '/webcraft/rules/manage-workflow/',
};
