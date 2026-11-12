import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { JSONContent } from "@tiptap/react";
import { AppDialog } from "@/shared/ui/composites/dialog/AppDialog";
import { RichBody } from "@/shared/ui/composites/editor/RichBody";
import { RichDraft } from "@/shared/ui/composites/editor/RichDraft";
import { useState } from "react";
import { fakePreview, fakeUpload, fileSample, richSample, sampleLinks } from "./editor-fixtures";

/** 쓰는 본문: 모든 블록이 든 견본. 올리기와 링크 미리보기는 가짜 호스트가 맡는다. */
export function Writing({ value = richSample }: { value?: JSONContent }) {
  const [, setValue] = useState(value);
  return <VStack width="min(48rem, 100vw - 2rem)" paddingBlock={6} paddingInlineStart={8}>
    <RichDraft value={value} onChange={setValue} isPage label="본문" upload={fakeUpload} readPreview={fakePreview} links={sampleLinks} />
  </VStack>;
}

/** 읽는 본문: 사진·도표는 눌러 크게 보고, 링크 카드는 새 탭 링크, 앱 안의 링크는 그 화면으로 간다(여기서는 간 곳을 보인다). */
export function Reading({ value = richSample }: { value?: JSONContent }) {
  const [went, setWent] = useState("");
  return <VStack width="min(45rem, 100vw - 2rem)" gap={3} paddingBlock={6}>
    {went ? <Text type="supporting" color="secondary" role="status">이동: {went}</Text> : null}
    <RichBody value={value} readPreview={fakePreview} onNavigate={setWent} />
  </VStack>;
}

/** 대화상자 안의 본문 칸: 데스크톱 좌우 여백(40px) 안에 블록 손잡이가 들어온다. */
function InDialog() {
  const [isOpen, setOpen] = useState(false);
  const [, setValue] = useState<JSONContent>();
  return <>
    <Button label="메모 쓰기" onClick={() => setOpen(true)} />
    <AppDialog isOpen={isOpen} onOpenChange={setOpen} title="새 메모" width="36rem" footer={<Button label="저장" variant="primary" onClick={() => setOpen(false)} />}>
      <RichDraft onChange={setValue} placeholder="무엇을 남길지 적어 보세요. / 로 블록을 넣습니다." upload={fakeUpload} readPreview={fakePreview} links={sampleLinks} />
    </AppDialog>
  </>;
}

const empty: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const meta = { title: "Composites (조합 부품)/리치 에디터", id: "composites-editor", layout: "padded", height: "44rem" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Write: Sample = { name: "쓰기: 표·도표·사진·파일·링크 카드", render: () => <Writing /> };
export const Read: Sample = { name: "읽기", render: () => <Reading /> };
export const Blank: Sample = { name: "빈 본문에서 / 명령", height: "26rem", render: () => <Writing value={empty} /> };
export const Files: Sample = { name: "파일 카드의 종류", height: "34rem", render: () => <Reading value={fileSample} /> };
export const Dialog: Sample = { name: "대화상자 안의 본문 칸", layout: "centered", height: "30rem", render: () => <InDialog /> };
export const Phone: Sample = { name: "휴대폰에서 쓰기", device: "phone", render: () => <Writing /> };
