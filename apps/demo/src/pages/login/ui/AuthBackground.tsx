import { useEffect, useRef } from "react"
import { useAppearance } from "@/shared/lib/appearance"

/**
 * 토큰(var(--foreground) 등)을 셰이더가 읽는 rgb 글자로 푼다. color-mix · oklch도 받도록 1px 캔버스에 칠해 다시 읽는다.
 * host 안에 두고 재야 .dark 아래의 값이 나온다.
 */
function cssColor(host: HTMLElement, token: string) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const context = canvas.getContext("2d")
  const probe = document.createElement("i")
  probe.style.color = `var(${token})`
  host.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  if (!context) return resolved
  context.fillStyle = resolved
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * 로그인 바탕(호호코워크 AuthBackground): @paper-design/shaders의 결 그라디언트(grain gradient, wave) 셰이더를 같은 값으로 그린다.
 * 색은 호호코워크 토큰과 같은 값의 우리 토큰이다(accent → --foreground, text-secondary → --muted-foreground,
 * background-muted → --muted, surface → --background). 모드가 바뀌면 다시 읽어 새로 그린다.
 * 움직임 줄이기이거나 WebGL이 없으면 셰이더를 띄우지 않고 아래의 CSS 근사(물결 두 겹 + 잔결)가 그대로 보인다.
 * 셰이더 묶음은 이 화면에서만 동적으로 불러 앱 첫 화면의 크기에 넣지 않는다.
 */
export function AuthBackground() {
  const host = useRef<HTMLDivElement>(null)
  const appearance = useAppearance()
  useEffect(() => {
    let disposed = false
    let mount: { dispose(): void } | undefined
    let generation = 0
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    const system = matchMedia("(prefers-color-scheme: dark)")
    const render = async () => {
      const request = ++generation
      mount?.dispose()
      mount = undefined
      if (motion.matches || !host.current) return
      try {
        // await가 한 번 양보하므로, 시스템 모드가 바뀐 때도 appearance가 .dark를 먼저 고친 뒤에 색을 읽는다.
        const shader = await import("@paper-design/shaders")
        const element = host.current
        if (disposed || request !== generation || !element) return
        const color = (token: string) => shader.getShaderColorFromString(cssColor(element, token))
        const colors = ["--foreground", "--muted-foreground", "--muted"].map(color)
        mount = new shader.ShaderMount(element, shader.grainGradientFragmentShader, {
          u_fit: shader.ShaderFitOptions.cover, u_scale: 1, u_rotation: 0, u_originX: 0.5, u_originY: 0.5,
          u_offsetX: 0, u_offsetY: 0, u_worldWidth: 0, u_worldHeight: 0,
          u_colorBack: color("--background"),
          u_colors: colors, u_colorsCount: colors.length, u_softness: 0.85, u_intensity: 0.5, u_noise: 0.3,
          u_shape: shader.GrainGradientShapes.wave,
        }, undefined, 0.35)
      } catch {
        // WebGL이 없어 생성자가 실패해도 캔버스를 먼저 붙였을 수 있다. 지워야 CSS 근사가 보인다.
        if (!disposed && request === generation) host.current?.querySelector(":scope > canvas")?.remove()
      }
    }
    void render()
    motion.addEventListener("change", render)
    system.addEventListener("change", render)
    return () => {
      disposed = true
      mount?.dispose()
      motion.removeEventListener("change", render)
      system.removeEventListener("change", render)
    }
  }, [appearance.mode])
  return (
    <div ref={host} aria-hidden className="absolute inset-0 -z-10 bg-sidebar [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:z-10 [&>canvas]:size-full">
      <div className="absolute inset-0 bg-[radial-gradient(42%_26%_at_50%_30%,color-mix(in_srgb,var(--foreground)_38%,transparent),transparent),radial-gradient(36%_30%_at_8%_44%,color-mix(in_srgb,var(--foreground)_32%,transparent),transparent),radial-gradient(34%_34%_at_90%_56%,color-mix(in_srgb,var(--foreground)_40%,transparent),transparent)] blur-2xl" />
      <svg className="absolute inset-0 size-full opacity-70 mix-blend-overlay">
        <filter id="auth-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-grain)" />
      </svg>
    </div>
  )
}
