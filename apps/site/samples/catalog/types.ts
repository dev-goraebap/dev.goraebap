import type { ComponentProps, ComponentType, ReactNode } from "react";

/**
 * 견본 파일(`*.samples.tsx`)의 형식. 기본 내보내기(meta)가 묶음을, 이름 있는 내보내기가 견본 하나를 정한다.
 * 가이드 사이트는 견본을 iframe으로 띄우고, 검사는 같은 견본을 그려 `play`를 실행한다.
 */
export type Device = "desktop" | "phone";
/** centered: 가운데 놓기, padded: 여백 두고 위에서부터, fullscreen: 화면 전체(앱 셸·페이지). */
export type Layout = "centered" | "padded" | "fullscreen";
/**
 * 견본이 쓰는 UI 키트. Astryx에서 shadcn 키트로 옮기는 동안 견본 틀(SampleView)이 키트마다 다른 바탕을 깐다.
 * - astryx(기본): ReferenceTheme으로 감싸고, 견본 iframe에 Astryx CSS(foundations/base.css)를 읽는다.
 * - shadcn: html의 data-theme만 두고(토큰은 tailwind.css), TooltipProvider · Toaster · 메모리 라우터로 감싼다. Astryx CSS를 읽지 않는다.
 * 옮긴 견본 파일은 meta(기본 내보내기)에 kit: "shadcn"을 적는다. 모두 옮기면 기본을 shadcn으로 바꾸고 이 값을 없앤다.
 */
export type Kit = "astryx" | "shadcn";

type Frame = {
  layout?: Layout;
  /** 가이드에서 iframe 높이. 없으면 내용 높이를 따른다. */
  height?: string;
  /** phone이면 가이드는 390px 폭으로 띄우고 검사는 390×844 창에서 실행한다. */
  device?: Device;
  /** shadcn 견본의 메모리 라우터가 처음 여는 주소(기본 "/"). 셸 · 페이지 견본이 지금 메뉴 자리를 보일 때 쓴다. 견본 값이 묶음 값을 덮는다. */
  path?: string;
};

/** 묶음에만 정하는 것. 한 파일의 견본은 같은 키트를 쓴다(견본 iframe이 키트마다 다른 CSS를 읽으므로 섞지 않는다). */
type GroupFrame = {
  /** 없으면 astryx. 위 Kit 설명. */
  kit?: Kit;
};

type AnyComponent = ComponentType<any>;
type ArgsOf<M> = M extends { component: infer C extends AnyComponent } ? ComponentProps<C> : Record<string, unknown>;

export type Meta<C extends AnyComponent = AnyComponent> = Frame & GroupFrame & {
  /** "범주/묶음 이름". 범주는 영문(한글) 표기를 쓴다. */
  title: string;
  id: string;
  component?: C;
  args?: Partial<ComponentProps<C>>;
  render?: (args: ComponentProps<C>) => ReactNode;
};

export type PlayContext = { canvasElement: HTMLElement };

export type SampleOf<M> = Frame & {
  name: string;
  args?: Partial<ArgsOf<M>>;
  render?: (args: ArgsOf<M>) => ReactNode;
  /** 검사에서만 실행하는 조작과 확인. */
  play?: (context: PlayContext) => Promise<void>;
};

export type Sample = SampleOf<{ component: AnyComponent }>;
export type SampleModule = { default: Meta } & Record<string, Sample | Meta>;
