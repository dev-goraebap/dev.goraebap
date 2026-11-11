import { SparklesIcon } from "@/shared/ui/icon"

/** 제품 로고 자리. 호호코워크 로고 대신 중립적인 표시를 쓴다(공개 저장소라 회사 자산을 넣지 않는다). */
export function Brand({ isFolded }: { isFolded?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center squircle rounded-md bg-primary text-primary-foreground">
        <SparklesIcon chosen className="size-4" />
      </span>
      {!isFolded && <span className="text-[1.125rem] font-bold tracking-tight">cowork</span>}
    </span>
  )
}
