import { fileURLToPath } from "node:url";
import stylex from "@stylexjs/unplugin";

/*
 * 키트·견본의 StyleX(xstyle, stylex.props)를 컴파일한다. Astryx 문서(styling-overview)와 @astryxdesign/build가 정한 방식을 따른다.
 * - 컴파일 대상은 site/src와 site/samples뿐이다. node_modules의 Astryx는 미리 컴파일된 astryx.css로 그린다.
 * - 클래스 접두사를 `wc`로 바꾼다. 미리 컴파일된 astryx.css가 기본 접두사 `x`를 쓰므로, 같은 선언을 쓰면 클래스 이름이 겹친다.
 *   겹친 클래스를 위 레이어에 다시 쓰면 그 클래스를 쓰는 모든 Astryx 부품이 테마를 이기게 된다.
 * - 규칙은 `app` 레이어 안에 둔다. 순서는 `theme < base < reset < astryx-base < astryx-theme < app < components < utilities`(index.html·sample.html)이므로 앱 스타일이
 *   테마를 이긴다. @astryxdesign/build의 product 레이어와 같은 자리다.
 * - 빌드에서는 레이어 순서를 선언하는 진입 CSS(foundations/base.css)가 든 파일에 붙인다. 플러그인에 맡기면 아무 청크에나 붙어서,
 *   그 청크를 읽지 않는 화면에서는 스타일이 빠진다.
 */
const slashed = (path: string) => path.split("\\").join("/");
const ownSource = ["./src/", "./samples/"].map(dir => slashed(fileURLToPath(new URL(dir, import.meta.url))));
const entryLayerOrder = "@layertheme,base,reset,astryx-base,astryx-theme,app,components,utilities;"; // 공백을 지운 소스와 비교한다.

type Asset = { type: string; fileName: string; source?: string | Uint8Array };
type Hook = (this: unknown, ...args: any[]) => unknown;

export function stylexForOwnSource() {
  let entryCss: string | undefined;
  const plugin = stylex.vite({
    classNamePrefix: "wc",
    useCSSLayers: { prefix: "app" },
    unstable_moduleResolution: { type: "commonJS", rootDir: fileURLToPath(new URL(".", import.meta.url)) },
    cssInjectionTarget: (fileName: string) => fileName === entryCss,
  });
  const transform = plugin.transform as Hook;
  const generateBundle = plugin.generateBundle as Hook;
  return {
    ...plugin,
    transform(this: unknown, code: string, id: string, ...rest: unknown[]) {
      const file = slashed(id);
      return ownSource.some(dir => file.startsWith(dir)) ? transform.call(this, code, id, ...rest) : null;
    },
    generateBundle(this: unknown, options: unknown, bundle: Record<string, Asset>) {
      const entry = Object.values(bundle).find(asset => asset.type === "asset" && asset.fileName.endsWith(".css")
        && String(asset.source ?? "").replace(/\s/g, "").includes(entryLayerOrder));
      if (!entry) throw new Error("StyleX: 레이어 순서를 선언한 진입 CSS(foundations/base.css)를 빌드에서 찾지 못했습니다.");
      entryCss = entry.fileName;
      return generateBundle.call(this, options, bundle);
    },
  };
}
