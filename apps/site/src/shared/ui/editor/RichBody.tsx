import type { JSONContent } from "@tiptap/react"
import { useRef } from "react"
import { RichEditor } from "./RichEditor"
import type { ReadLinkPreview } from "./types"

/**
 * 읽는 본문: 작성할 때의 스키마 그대로 읽는다. 사진 · 도표는 눌러 크게 보고, 링크 카드는 카드 전체가 새 탭 링크다. 앱 안의 주소로
 * 가는 링크(문서 언급)는 onNavigate가 있으면 새 탭 대신 그 화면으로 간다. 값이 바뀌면(저장 뒤 다시 읽기) 새로 그린다.
 */
export function RichBody({ value, readPreview, onNavigate, label = "본문" }: {
  value: JSONContent; readPreview?: ReadLinkPreview; onNavigate?: (href: string) => void; label?: string
}) {
  // 같은 내용이면 다시 만들지 않는다(속성만 바뀐 상세를 다시 읽을 때 선택 영역과 그림을 지킨다).
  const versions = useRef<{ text: string; key: number }>({ text: "", key: 0 })
  const text = JSON.stringify(value)
  if (text !== versions.current.text) versions.current = { text, key: versions.current.key + 1 }
  return <RichEditor key={versions.current.key} value={value} isEditable={false} label={label} readPreview={readPreview} onNavigate={onNavigate} />
}
