import type { KnipConfig } from 'knip';

/**
 * 안 쓰는 파일 · export · 패키지 찾기. 앱의 시작점(index.html → app/entry.tsx)은 knip의 Vite 플러그인이 찾고,
 * 라우트는 생성된 routeTree.gen.ts를 거쳐 이어진다.
 */
const config: KnipConfig = {
  // 화면 키트(shared/ui)는 부품 전체가 공개 API다: 아직 쓰지 않는 하위 부품 · 변형도 남긴다.
  entry: [
    'src/shared/ui/**/*.{ts,tsx}',
    'src/pages/**/{__root,route,page,new,history,$id}.tsx',
    'scripts/**/*.{mjs,js}',
    'public/*.js',
  ],
  project: ['src/**/*.{ts,tsx,css}', 'scripts/**/*.{mjs,js}'],
  // 같은 파일 안에서 쓰는 export는 알리지 않는다.
  ignoreExportsUsedInFile: true,
  // CSS의 @import · @plugin도 가져오기로 읽는다(글꼴 · Tailwind 플러그인).
  compilers: {
    css: (text: string) => [...text.replaceAll('@plugin', '@import').matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
