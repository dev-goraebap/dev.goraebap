/**
 * 로그인 바탕(호호코워크는 WebGL 결 그라디언트 셰이더). 여기서는 글자색을 섞은 두 물결과 그 위의 잔결(노이즈)로 비슷하게 그린다.
 * 색은 토큰이라 다크에서는 밝은 물결이 된다. 셰이더 라이브러리를 들이지 않기 위한 근사다.
 */
export function AuthBackground() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-sidebar">
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
