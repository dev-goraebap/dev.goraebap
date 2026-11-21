import {useEffect,useRef,useState,type RefObject} from 'react';
import {ReactNodeViewRenderer} from '@tiptap/react';
import katex from 'katex';
import {embedURL} from './embed';
import {useAppearance,type DiagramStyle} from '@/shared/lib/appearance';
import {diagramBackground,diagramConfig,type Scheme} from './diagram-style';

import {richNode,type RichKind} from './rich-node-spec';
export const labels:Record<RichKind,string>={mathBlock:'수식',inlineMath:'인라인 수식',mermaidBlock:'Mermaid',webEmbed:'링크 카드'};
export let mermaidModule:Promise<typeof import('mermaid')>|undefined;
export type {Scheme};
// 도표의 그림체(화면 설정)와 라이트 · 다크마다의 색은 diagram-style.ts가 정한다.
export {diagramBackground};
/** The page's colour scheme, as the app theme sets it on <html>. */
const pageScheme=():Scheme=>getComputedStyle(document.documentElement).colorScheme.includes('dark')?'dark':'light';
function useScheme(){
 const [scheme,setScheme]=useState(pageScheme);
 useEffect(()=>{const watch=new MutationObserver(()=>setScheme(pageScheme()));watch.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});return()=>watch.disconnect();},[]);
 return scheme;
}
// Mermaid's settings are global: each diagram sets its scheme and renders before the next one sets its own.
let rendering:Promise<unknown>=Promise.resolve();
// 그린 도표(같은 원문·색표)는 기억해 두고 다시 그리지 않는다. 도표 하나를 그리는 데 긴 문서에서 1~2초가 걸려 화면이 멈췄다.
const drawnDiagrams=new Map<string,Promise<string>>();
export function diagram(source:string,scheme:Scheme,style:DiagramStyle):Promise<string>{
 const key=`${style}:${scheme}
${source}`,known=drawnDiagrams.get(key);
 if(known)return known;
 const made=drawDiagram(source,scheme,style);
 drawnDiagrams.set(key,made);made.catch(()=>drawnDiagrams.delete(key));
 // 오래된 것부터 버린다(편집하며 바뀐 원문이 쌓이지 않게).
 if(drawnDiagrams.size>80)drawnDiagrams.delete(drawnDiagrams.keys().next().value!);
 return made;
}
async function drawDiagram(source:string,scheme:Scheme,style:DiagramStyle){
 mermaidModule??=import('mermaid');
 const {default:mermaid}=await mermaidModule;
 const turn=rendering.then(()=>{mermaid.initialize({startOnLoad:false,theme:'base',...diagramConfig(style,scheme),securityLevel:'strict',htmlLabels:false,maxTextSize:30000,maxEdges:200,suppressErrorRendering:true,secure:['securityLevel','startOnLoad','maxTextSize','maxEdges','suppressErrorRendering']});return draw(mermaid,source);});
 rendering=turn.catch(()=>undefined);
 return turn;
}
async function draw(mermaid:typeof import('mermaid').default,source:string){
 const id=`diagram-${crypto.randomUUID()}`;
 // Without a container Mermaid lays the diagram out in a div it appends to <body> in normal flow, below the app, and
 // keeps it there through the render: the page grows past the window and its scrollbar flashes. Lay it out in a
 // fixed, zero-height, hidden box instead, the window's width as <body>'s was, so nothing reaches the page's height.
 const holder=document.createElement('div');holder.setAttribute('aria-hidden','true');
 holder.style.cssText='position:fixed;left:0;top:0;width:100%;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
 document.body.append(holder);
 const {svg}=await mermaid.render(id,source,holder).finally(()=>holder.remove());const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement as unknown as SVGSVGElement;const width=Number(root.getAttribute('viewBox')?.split(/[ ,]+/)[2]);if(Number.isFinite(width)&&width>0){/* 칸 폭을 채운다(잘리지 않게 비율 유지). 아주 작은 도표가 지나치게 커지지 않게 원래 크기의 3배까지만 키우고, 높이 한도는 CSS가 둔다. */root.style.width='100%';root.style.maxWidth=`${Math.round(width*3)}px`;root.style.height='auto';}return root.outerHTML;
}
/**
 * 미리보기(수식·도표·링크 카드)를 만든다. 도표는 화면 가까이(위아래 1500px 안) 왔을 때 처음 그린다: 긴 문서의 도표를 처음에 모두
 * 그리면 그동안 화면이 멈춘다. target은 도표 자리이고, 그 조상에 data-render-all이 있으면(PDF 인쇄 화면) 바로 그린다.
 */
export function usePreview(kind:RichKind,source:string,target?:RefObject<HTMLElement|null>){
 const [state,setState]=useState({html:'',error:'',pending:true});
 const [isNear,setNear]=useState(kind!=='mermaidBlock');
 useEffect(()=>{
  if(isNear)return undefined;
  const element=target?.current;
  if(!element||element.closest('[data-render-all]')||typeof IntersectionObserver==='undefined'){setNear(true);return undefined;}
  const watch=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNear(true);watch.disconnect();}},{rootMargin:'1500px 0px'});
  watch.observe(element);
  return()=>watch.disconnect();
 },[isNear,target]);
 // Only a diagram is drawn in the page's colours; when just those change it keeps its picture until the new one is ready.
 const pageColours=useScheme(),scheme=kind==='mermaidBlock'?pageColours:'light',drawn=useRef({kind,source});
 // 그림체가 바뀌어도 색이 바뀔 때처럼 새 그림이 준비될 때까지 지금 그림을 둔다.
 const style=useAppearance().diagram;
 useEffect(()=>{let disposed=false;const recolour=drawn.current.kind===kind&&drawn.current.source===source;drawn.current={kind,source};
  if(!recolour)setState({html:'',error:'',pending:true});
  if(!isNear)return()=>{disposed=true;};
  const timer=setTimeout(()=>{void(async()=>{try{
    if(!source.trim())throw Error(kind==='webEmbed'?'웹 주소를 입력하세요.':'원문을 입력하세요.');
    if(source.length>30000)throw Error('원문은 30,000자까지 입력할 수 있습니다.');
    let html='';if(kind==='mathBlock'||kind==='inlineMath')html=katex.renderToString(source,{displayMode:kind==='mathBlock',throwOnError:true,trust:false,strict:'error',maxExpand:1000,maxSize:20,output:'htmlAndMathml'});
    if(kind==='mermaidBlock')html=await diagram(source,scheme,style);
    if(kind==='webEmbed')embedURL(source);
    if(!disposed)setState({html,error:'',pending:false});
   }catch(error){if(!disposed)setState({html:'',error:(error instanceof Error?error.message:'미리보기를 만들지 못했습니다').slice(0,350),pending:false});}})();},kind==='mermaidBlock'?150:0);
  return()=>{disposed=true;clearTimeout(timer);};
 },[kind,source,scheme,style,isNear]);return state;
}

;
import {RichView} from './RichView';
export const richNodeViews=(['mathBlock','inlineMath','mermaidBlock','webEmbed'] as RichKind[]).map(kind=>richNode(kind).extend({addNodeView(){return ReactNodeViewRenderer(RichView);}}));
