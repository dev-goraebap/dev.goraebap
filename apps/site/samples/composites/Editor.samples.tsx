import type { Meta, SampleOf } from "../catalog/types";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/shared/ui/button";
import { Dialog as DialogRoot, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { RichBody, RichDraft } from "@/shared/ui/editor";
import { XIcon } from "@/shared/ui/icon";
import { useState } from "react";
import { fakePreview, fakeUpload, fileSample, richSample, sampleLinks } from "./editor-fixtures";

/** 쓰는 본문: 모든 블록이 든 견본. 올리기와 링크 미리보기는 가짜 호스트가 맡는다. 왼쪽 여백은 블록 손잡이 자리다. */
export function Writing({ value = richSample }: { value?: JSONContent }) {
  const [, setValue] = useState(value);
  return <div className="w-[min(48rem,100vw-2rem)] py-6 pl-8">
    <RichDraft value={value} onChange={setValue} isPage label="본문" upload={fakeUpload} readPreview={fakePreview} links={sampleLinks} />
  </div>;
}

/** 읽는 본문: 사진 · 도표는 눌러 크게 보고, 링크 카드는 새 탭 링크, 앱 안의 링크는 그 화면으로 간다(여기서는 간 곳을 보인다). */
export function Reading({ value = richSample }: { value?: JSONContent }) {
  const [went, setWent] = useState("");
  return <div className="flex w-[min(45rem,100vw-2rem)] flex-col gap-3 py-6">
    {went ? <p role="status" className="text-xs text-muted-foreground">이동: {went}</p> : null}
    <RichBody value={value} readPreview={fakePreview} onNavigate={setWent} />
  </div>;
}

/** 대화상자 안의 본문 칸: 좌우 여백(40px) 안에 블록 손잡이가 들어온다. 키트에 머리 · 본문 · 바닥 틀이 없어 Dialog로 짓는다. */
function InDialog() {
  const [isOpen, setOpen] = useState(false);
  const [, setValue] = useState<JSONContent>();
  return <>
    <Button onClick={() => setOpen(true)}>메모 쓰기</Button>
    <DialogRoot open={isOpen} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="top-[12dvh] flex max-h-[76dvh] translate-y-0 flex-col gap-0 p-0 sm:max-w-xl">
        <header className="flex items-center gap-3 px-4 pt-4 pb-2">
          <DialogTitle className="min-w-0 flex-1 text-base font-semibold">새 메모</DialogTitle>
          <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" className="max-md:size-11" />}><XIcon /></DialogClose>
        </header>
        <div className="min-h-0 overflow-y-auto px-10 py-2">
          <RichDraft onChange={setValue} placeholder="무엇을 남길지 적어 보세요. / 로 블록을 넣습니다." upload={fakeUpload} readPreview={fakePreview} links={sampleLinks} />
        </div>
        <footer className="flex justify-end px-4 pt-2 pb-4"><Button onClick={() => setOpen(false)} className="max-md:h-11">저장</Button></footer>
      </DialogContent>
    </DialogRoot>
  </>;
}

const empty: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const meta = { title: "Composites (조합 부품)/리치 에디터", id: "composites-editor", layout: "padded", height: "44rem", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Write: Sample = { name: "쓰기: 표·도표·사진·파일·링크 카드", render: () => <Writing /> };
export const Read: Sample = { name: "읽기", render: () => <Reading /> };
export const Blank: Sample = { name: "빈 본문에서 / 명령", height: "26rem", render: () => <Writing value={empty} /> };
export const Files: Sample = { name: "파일 카드의 종류", height: "34rem", render: () => <Reading value={fileSample} /> };
export const Dialog: Sample = { name: "대화상자 안의 본문 칸", layout: "centered", height: "30rem", render: () => <InDialog /> };
export const Phone: Sample = { name: "휴대폰에서 쓰기", device: "phone", render: () => <Writing /> };
