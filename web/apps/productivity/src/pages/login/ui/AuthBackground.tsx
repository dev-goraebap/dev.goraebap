import { useEffect, useRef } from 'react';
import { useAppearance } from '@/shared/lib/appearance';

/**
 * A token (var(--primary) and the like) as the rgb text the shader reads. Painted on a 1px canvas and read back, so
 * color-mix and oklch come out as plain rgb too; measured inside host so the theme in force there is the one read.
 */
function cssColor(host: HTMLElement, token: string) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d');
  const probe = document.createElement('i'); probe.style.color = `var(${token})`; host.append(probe);
  const resolved = getComputedStyle(probe).color; probe.remove();
  if (!context) return resolved;
  context.fillStyle = resolved; context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The original HR wave shader, loaded only on the sign-in screen, in the colour theme's own colours (its accent, the
 * secondary ink and the muted ground over the surface). With reduced motion or no WebGL the gradient under it shows.
 */
export function AuthBackground() {
  const host = useRef<HTMLDivElement>(null);
  const appearance = useAppearance();
  useEffect(() => {
    let disposed = false;
    let mount: { dispose(): void } | undefined;
    let generation = 0;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const system = matchMedia('(prefers-color-scheme: dark)');
    const render = async () => {
      const request = ++generation;
      mount?.dispose(); mount = undefined;
      if (motion.matches || !host.current) return;
      try {
        // The await yields once, so a system mode change has put its colours on html before they are read.
        const shader = await import('@paper-design/shaders');
        const element = host.current;
        if (disposed || request !== generation || !element) return;
        const color = (token: string) => shader.getShaderColorFromString(cssColor(element, token));
        const colors = ['--primary', '--muted-foreground', '--muted'].map(color);
        mount = new shader.ShaderMount(element, shader.grainGradientFragmentShader, {
          u_fit: shader.ShaderFitOptions.cover, u_scale: 1, u_rotation: 0, u_originX: .5, u_originY: .5,
          u_offsetX: 0, u_offsetY: 0, u_worldWidth: 0, u_worldHeight: 0,
          u_colorBack: color('--background'),
          u_colors: colors, u_colorsCount: colors.length, u_softness: .85, u_intensity: .5, u_noise: .3,
          u_shape: shader.GrainGradientShapes.wave,
        }, undefined, .35);
      } catch {
        // A constructor failure may have appended a canvas before WebGL was available.
        if (!disposed && request === generation) host.current?.replaceChildren();
      }
    };
    void render(); motion.addEventListener('change', render); system.addEventListener('change', render);
    return () => { disposed = true; mount?.dispose(); motion.removeEventListener('change', render); system.removeEventListener('change', render); };
  }, [appearance]);
  return <div ref={host} aria-hidden="true"
    className="absolute inset-0 -z-10 bg-linear-135 from-muted to-primary [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:size-full" />;
}
