import { useEffect, useRef, useState } from "react";

// 현재 세션에서 이미 로드된 이미지 주소는 재진입·필터 전환 때 다시 숨기지 않는다.
const loadedImageUrls = new Set<string>();

export interface DominantColorImageProps {
  src: string;
  alt: string;
  dominantColor?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  className?: string;
  imgClassName?: string;
}

export function DominantColorImage({
  src,
  alt,
  dominantColor,
  loading = "lazy",
  decoding = "async",
  className = "",
  imgClassName = "",
}: DominantColorImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(() =>
    loadedImageUrls.has(src) ? src : null,
  );
  const isLoaded = loadedSrc === src || loadedImageUrls.has(src);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    loadedImageUrls.add(src);
    const raf = window.requestAnimationFrame(() => setLoadedSrc(src));
    return () => window.cancelAnimationFrame(raf);
  }, [src]);

  function markLoaded() {
    loadedImageUrls.add(src);
    setLoadedSrc(src);
  }

  return (
    <div
      style={dominantColor ? { backgroundColor: dominantColor } : undefined}
      className={`overflow-hidden ${dominantColor ? "" : "bg-muted/40"} ${className}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={markLoaded}
        onError={markLoaded}
        className={`size-full object-cover transition-[opacity,scale,transform] duration-300 ease-out motion-reduce:transition-none ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
      />
    </div>
  );
}
