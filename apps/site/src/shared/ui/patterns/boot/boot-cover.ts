import type { Plugin } from 'vite';
import { bootColor, bootColors } from './boot-colors';

/**
 * 첫 방문 덮개를 index.html에 넣는 Vite 플러그인. 앱 스크립트가 오기 전에도 테마 색의 덮개(그림 + "불러오는 중입니다")가
 * 바로 보인다. 앱이 뜨면 같은 모양의 BootCover가 이어받는다.
 *
 *   plugins: [react(), bootCover({ mark: readFileSync('src/app/boot-mark.svg', 'utf8'), modeKey: 'myapp-mode' })]
 *
 * index.html의 앱 자리는 `<div id="root"></div>`여야 한다. modeKey는 앱이 라이트·다크 선택을 저장하는 localStorage 키다.
 * 저장한 값이 'light'·'dark'가 아니면 시스템 설정을 따른다.
 */
export function bootCover({ mark, modeKey, label = '불러오는 중입니다', rootId = 'root', include }: {
  /** 그림 SVG 원문. 선은 rgb(0,0,0), 면은 rgb(254,254,255)로 그리면 테마 색으로 바뀐다. */
  mark: string;
  modeKey: string;
  label?: string;
  rootId?: string;
  /** 덮개를 넣을 HTML(예: path => path === '/index.html'). 없으면 모든 HTML 입구. */
  include?: (path: string) => boolean;
}): Plugin {
  const style = `<style>.boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;margin:0;`
    + `background:${bootColor('body')};color:${bootColor('secondary')};font:.75rem/1.5 system-ui,sans-serif}`
    + `.boot-mark{width:10rem;height:10rem;margin:0}.boot-mark svg{display:block;width:100%;height:100%}`
    + `.boot-mark [stroke="rgb(0,0,0)"]{stroke:${bootColor('secondary')}}.boot-mark [fill="rgb(0,0,0)"]{fill:${bootColor('secondary')}}`
    + `.boot-mark [fill="rgb(254,254,255)"]{fill:${bootColor('surface')}}</style>`;
  const themeMeta = `<meta name="theme-color" content="${bootColors.surface[0]}">`;
  const mode = `<script>var m;try{m=localStorage.getItem(${JSON.stringify(modeKey)})}catch(e){}`
    + `var d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);`
    + `document.documentElement.style.colorScheme=d?'dark':'light';`
    + `var c=d?${JSON.stringify(bootColors.surface[1])}:${JSON.stringify(bootColors.surface[0])};`
    + `document.querySelector('meta[name="theme-color"]').content=c;document.documentElement.style.backgroundColor=c;</script>`;
  const cover = `<section class="boot" role="status" aria-label="${label}"><figure class="boot-mark" aria-hidden="true">${mark}</figure>${label}</section>`;
  return {
    name: 'boot-cover',
    transformIndexHtml(html, context) {
      if (include && context && !include(context.path)) return html;
      const slot = `<div id="${rootId}"></div>`;
      if (!html.includes(slot)) throw new Error(`bootCover: index.html에 ${slot}이 없습니다.`);
      const meta = /<meta\b[^>]*\bname=["']theme-color["']/i.test(html) ? '' : themeMeta;
      return html.replace('</head>', `${style}${meta}${mode}</head>`).replace(slot, `<div id="${rootId}">${cover}</div>`);
    },
  };
}
