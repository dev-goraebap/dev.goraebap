import type {DiagramStyle} from '@/shared/lib/appearance';

export type Scheme='light'|'dark';

/**
 * 도표(Mermaid)의 네 가지 그림체(화면 설정, Linear의 Diagram style을 따른다). 어느 것이든 라이트 · 다크마다 색을 따로 둔다: Mermaid는
 * 글자 · 선을 한 색으로 그려, 다크의 밝은 글자가 라이트 바탕에서 사라진다.
 * - default: 고정폭 글꼴, 가는 선, 바탕에 가까운 면, 둥근 모서리 조금. 묶음은 왼쪽 위 흐린 이름.
 * - tui: 터미널 화면처럼 고정폭 글꼴, 각진 상자, 면 없이 글자색 선, 꺾인 연결선.
 * - hairline: 면 없이 아주 가는 선과 본문 글꼴.
 * - handDrawn: 손으로 그린 듯한 선(Mermaid의 handDrawn look), 본문 글꼴.
 */
type Palette={background:string;surface:string;text:string;muted:string;border:string;line:string};
const palettes:Record<Scheme,Palette>={
 dark:{background:'#1b1c1e',surface:'#232427',text:'#d8dadd',muted:'#8b9098',border:'#3b3e43',line:'#6e737b'},
 light:{background:'#fbfbfb',surface:'#f3f4f5',text:'#25272b',muted:'#7b8088',border:'#d3d6da',line:'#999da5'},
};
const MONO='"JetBrains Mono Variable", "Pretendard Variable", monospace';
const SANS='"Pretendard Variable", sans-serif';

/** 도표를 넓게 볼 때(크게 보기)의 바탕: 그 그림체의 바탕색. */
export const diagramBackground=(scheme:Scheme)=>palettes[scheme].background;

/** Mermaid.initialize에 넘길 그림체의 설정(테마 색 · 글꼴 · 선 · 연결선 모양). */
export function diagramConfig(style:DiagramStyle,scheme:Scheme){
 const c=palettes[scheme];
 const filled=style==='default'||style==='handDrawn';
 const ink=style==='tui'?c.text:c.border;
 const themeVariables={
  darkMode:scheme==='dark',background:c.background,fontFamily:style==='default'||style==='tui'?MONO:SANS,fontSize:style==='default'||style==='tui'?'13px':'14px',
  primaryColor:filled?c.surface:c.background,primaryTextColor:c.text,primaryBorderColor:ink,lineColor:style==='tui'?c.text:c.line,
  secondaryColor:filled?c.surface:c.background,tertiaryColor:c.background,textColor:c.text,
  clusterBkg:style==='default'?c.background:'transparent',clusterBorder:style==='tui'?c.text:c.border,titleColor:c.muted,
  edgeLabelBackground:c.background,nodeBorder:ink,mainBkg:filled?c.surface:c.background,
  noteBkgColor:c.surface,noteBorderColor:c.border,noteTextColor:c.text,actorBkg:filled?c.surface:c.background,actorBorder:ink,actorTextColor:c.text,
  signalColor:style==='tui'?c.text:c.line,signalTextColor:c.text,labelBoxBkgColor:c.background,labelBoxBorderColor:c.border,
 };
 const stroke=style==='hairline'?'0.75px':style==='tui'?'1.25px':'1px';
 const corner=style==='tui'?'0':style==='hairline'?'6px':'4px';
 // 선 굵기 · 모서리는 테마 색으로 정할 수 없어 SVG 안의 규칙으로 준다(Mermaid themeCSS, 그 도표 안에만 걸린다).
 const themeCSS=style==='handDrawn'?'':`
  .node rect,.node polygon,.node circle,.node path,.cluster rect,.actor,.note{stroke-width:${stroke}!important}
  .node rect,.cluster rect{rx:${corner};ry:${corner}}
  .flowchart-link,.edgePath .path,.messageLine0,.messageLine1,.relation{stroke-width:${stroke}!important}
  .cluster-label,.cluster-label text,.cluster .nodeLabel{fill:${c.muted};color:${c.muted};font-size:12px}
  .edgeLabel text,.edgeLabel span{font-size:11px;fill:${c.muted};color:${c.muted}}
  .edgeLabel rect,.labelBkg{fill:${c.background}!important;background:${c.background};opacity:1}`;
 return {
  look:style==='handDrawn'?'handDrawn' as const:'classic' as const,handDrawnSeed:1,themeVariables,themeCSS,
  flowchart:{htmlLabels:false,curve:(style==='tui'?'step':style==='hairline'?'basis':'linear') as 'step'|'basis'|'linear'},
 };
}
