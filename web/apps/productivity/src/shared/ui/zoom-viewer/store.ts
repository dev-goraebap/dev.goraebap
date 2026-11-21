import type { Slide } from 'yet-another-react-lightbox';

/** 크게 볼 도표: 그린 SVG 그대로(웹 글꼴과 색표 유지), 원래 크기와 바탕색과 함께. */
export type DiagramSlide = { type: 'diagram'; svg: string; width: number; height: number; label: string; background: string };
declare module 'yet-another-react-lightbox' {
  interface SlideTypes { diagram: DiagramSlide }
}
export type ZoomSlide = Slide | DiagramSlide;

/**
 * 앱에 하나뿐인 크게 보기 창의 상태. 리치 본문의 노드 뷰처럼 React 트리 밖에서 그려지는 곳도 함수 하나로 연다.
 */
let current: ZoomSlide | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
export const subscribeZoom = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const zoomSlide = () => current;
/** 이미지나 도표를 크게 보기 창으로 연다. */
export function openZoom(slide: ZoomSlide) { current = slide; notify(); }
export function closeZoom() { current = null; notify(); }

/** 그린 Mermaid SVG를 크게 보기 슬라이드로: viewBox에서 원래 크기를 읽는다. 크기를 모르면 null. */
export function diagramSlide(svg: SVGSVGElement | null | undefined, background: string, label = '본문의 구조와 흐름을 설명하는 도표'): DiagramSlide | null {
  const [, , width, height] = (svg?.getAttribute('viewBox') ?? '').split(/[ ,]+/).map(Number);
  if (!svg || !width || !height) return null;
  // 본문에서 폭에 맞추려고 붙인 크기(style)는 떼어, 창 안에서는 상자를 가득 채우게 한다.
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.removeAttribute('style');
  return { type: 'diagram', svg: copy.outerHTML, width, height, label, background };
}

/** 크게 볼 HTML 파일: 본문에 넣은 HTML 임베드의 주소와 이름. */
export type HtmlPage = { src: string; title: string };
let page: HtmlPage | null = null;
export const htmlPage = () => page;
/** 본문의 HTML 임베드를 창 가득 크게 보는 창으로 연다. */
export function openHtml(next: HtmlPage) { page = next; notify(); }
export function closeHtml() { page = null; notify(); }
