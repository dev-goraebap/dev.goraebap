import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bootColors, colorThemePalettes } from './src/app/theme/boot';
import { defineConfig } from 'vite';

// The product is index.html alone.
/** The release the screens are built for: the image's APP_VERSION (a GitLab tag), else the latest tag, else 'dev'. */
function releaseTag() {
  const given = process.env.APP_VERSION;
  if (given && given !== 'local') return given;
  try { return execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev'; } catch { return 'dev'; }
}

/**
 * virtual:solar-set, every Solar icon in its Linear style by name, for the mark picker's search (BIT's solar-set): taken from the package's whole set (about 12MB, every style) when the app is built, so the chunk carries only
 * these and the app's first load none of them (shared/ui/mark-picker fetches it the first time a picker opens). A name
 * longer than 30 letters is left out, as a mark keeps `s:` and the name in 32.
 */
function solarSet() {
  const id = 'virtual:solar-set';
  return {
    name: 'solar-set',
    resolveId: (source: string) => (source === id ? `\0${id}` : undefined),
    load(source: string) {
      if (source !== `\0${id}`) return undefined;
      const { icons } = JSON.parse(readFileSync(new URL('./node_modules/@iconify-json/solar/icons.json', import.meta.url), 'utf8')) as { icons: Record<string, { body: string }> };
      const linear = Object.entries(icons).filter(([name]) => name.endsWith('-linear')).map(([name, icon]) => [name.slice(0, -'-linear'.length), icon.body] as const)
        .filter(([name]) => name.length <= 30);
      return `export default ${JSON.stringify(Object.fromEntries(linear))};`;
    },
  };
}

/** 앱 번들을 읽기 전에도 원래 로켓의 정지 프레임을 표시한다. */
function initialCover() {
  return {
    name: 'initial-cover',
    transformIndexHtml(html: string) {
      const rocket = readFileSync(new URL('./src/shared/ui/page-loading/rocket-still.svg', import.meta.url), 'utf8');
      const color = (key: keyof typeof bootColors) => `light-dark(${bootColors[key][0]}, ${bootColors[key][1]})`;
      const themePalettes = Object.fromEntries(colorThemePalettes.map(([id, light, body, , secondary, , dark, darkBody, , darkSecondary]) => [id, { surface: [light, dark], body: [body, darkBody], secondary: [secondary, darkSecondary] }]));
      const style = `<style>.boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;margin:0;background:var(--boot-surface,${color('surface')});color:var(--boot-secondary,${color('secondary')});font: .75rem/1.5 system-ui,sans-serif}.boot-mark{width:10rem;height:10rem;margin:0}.boot-mark svg{display:block}.boot-mark [stroke="rgb(0,0,0)"]{stroke:var(--boot-secondary,${color('secondary')})}.boot-mark [fill="rgb(254,254,255)"],.boot-mark [fill="#ffffff"]{fill:var(--boot-surface,${color('surface')})}</style>`;
      const themeColor = `<meta name="theme-color" content="${bootColors.surface[0]}" data-palettes='${JSON.stringify(themePalettes)}' data-light="${bootColors.surface[0]}" data-dark="${bootColors.surface[1]}" />`;
      return html.replace('</head>', `${style}${themeColor}<script src="/boot.js"></script></head>`)
        .replace('<div id="root"></div>', `<div id="root"><section class="boot" role="status" aria-label="화면을 불러오는 중"><figure class="boot-mark" aria-hidden="true">${rocket}</figure>불러오는 중입니다</section></div>`);
    },
  };
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(releaseTag()) },
  // Tailwind CSS v4 builds the utilities from app/theme/tailwind.css.
  plugins: [
    // 파일 라우팅: src/pages의 폴더가 곧 주소다. page.tsx가 그 주소의 화면, route.tsx가 그 아래에 걸리는 틀이다.
    // 슬라이스 안의 세그먼트(ui · api · model · lib · config)와 공개 진입점(index.ts)은 라우트로 치지 않는다.
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/pages',
      generatedRouteTree: './src/app/router/routeTree.gen.ts',
      autoCodeSplitting: true, indexToken: 'page', routeFileIgnorePattern: '^(ui|api|model|lib|config|index\\.ts)$',
      quoteStyle: 'single',
    }),
    react(), tailwindcss(), solarSet(), initialCover(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  // The API is the local server's (server/, dev profile on 8080) unless DEV_API_TARGET names another.
  server: { port: 4420, strictPort: true,
    proxy: { '/api': { target: process.env.DEV_API_TARGET ?? 'http://localhost:8080', changeOrigin: true, ws: true } } },
});
