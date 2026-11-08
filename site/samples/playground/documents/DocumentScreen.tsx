import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { JSONContent } from "@tiptap/react";
import { RichDraft } from "@/shared/ui/composites/editor/RichDraft";
import { AppFrame } from "@/shared/ui/layouts/app/AppFrame";
import { Page } from "@/shared/ui/layouts/page/Page";
import { useEffect, useRef, useState } from "react";
import { DemoBrand, demoSpace } from "../../layouts/demo";
import styles from "../playground.module.css";

type Saving = "saved" | "dirty" | "saving";

/** 고친 뒤 0.8초 동안 손을 멈추면 저장한다(가짜 저장 0.4초). 저장 상태는 머리 줄 끝에서 조용히 알린다. */
function useAutosave(onSave: () => void) {
  const [state, setState] = useState<Saving>("saved");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const touch = () => {
    setState("dirty");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setState("saving");
      timer.current = window.setTimeout(() => { onSave(); setState("saved"); }, 400);
    }, 800);
  };
  return { state, touch };
}

const label: Record<Saving, string> = { saved: "저장됨", dirty: "고친 내용 있음", saving: "저장 중…" };

/**
 * 문서 편집 화면: 읽는 폭(약 720px) 열에 제목과 본문 칸(리치 에디터)을 종이처럼 둔다. 테두리·서식 도구 막대는 없고
 * 서식은 단축키와 입력 규칙으로 한다. 저장 버튼 대신 자동 저장하고 상태만 보인다. 휴대폰에서는 상세처럼 전체 화면이다.
 */
export function DocumentScreen({ title: initialTitle = "", body: initialBody }: { title?: string; body?: JSONContent }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const { state, touch } = useAutosave(() => {});
  return <AppFrame space={demoSpace} pathname="/items" brand={isFolded => <DemoBrand isFolded={isFolded} />}>
    <Page crumbs={[{ label: "문서" }, { label: title.trim() || "제목 없음" }]} isDetail hasPattern={false}
      pageActions={<Text type="supporting" color="secondary" role="status">{label[state]}</Text>}>
      <VStack className={styles.column} gap={4}>
        <input className={styles.docTitle} value={title} placeholder="제목 없음" aria-label="문서 제목"
          onChange={event => { setTitle(event.target.value); touch(); }} />
        <RichDraft value={body} isPage label="문서 본문" placeholder="내용을 입력하세요. # 제목, - 목록처럼 입력하면 서식이 됩니다."
          onChange={value => { setBody(value); touch(); }} />
      </VStack>
    </Page>
  </AppFrame>;
}

export const seededBody: JSONContent = { type: "doc", content: [
  { type: "paragraph", content: [{ type: "text", text: "이번 분기에 정리한 화면 규칙을 팀과 함께 검토하기 위한 메모입니다. 결정이 필요한 것과 이미 정한 것을 나눠 적습니다." }] },
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "이미 정한 것" }] },
  { type: "bulletList", content: [
    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "다음 화면이 준비될 때까지 지금 화면을 유지한다." }] }] },
    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "필수 값이 비어도 제출 버튼을 막지 않고, 누르면 빠진 항목을 알린다." }] }] },
  ] },
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "더 이야기할 것" }] },
  { type: "paragraph", content: [{ type: "text", text: "목록 옆 미리보기 패널을 어떤 화면까지 넓힐지 정한다." }] },
] };
