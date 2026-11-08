import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { Step, Stepper } from "@astryxdesign/core/Stepper";
import type { JSONContent } from "@tiptap/react";
import { RichDraft } from "@kit/composites/editor/RichDraft";
import { DatePill, OptionPill } from "@kit/composites/property/PropertyPill";
import { icon } from "@kit/foundations/icons/solar-icon";
import { ComposeForm, PaperForm } from "@kit/patterns/compose/ComposeForm";
import { ComposeSurface, PlaceChip } from "@kit/patterns/compose/ComposeSurface";
import { focusFirstInvalid } from "@kit/patterns/compose/validation";
import { useState } from "react";
import { LibrarySample } from "./library-sample";

type Draft = { title: string; body?: JSONContent; folder?: string; day?: string };
const empty: Draft = { title: "" };
const folders = [{ value: "design", label: "디자인 참고" }, { value: "dev", label: "개발 자료" }];

function Form({ draft, setDraft, isPage, isTried }: { draft: Draft; setDraft: (draft: Draft) => void; isPage: boolean; isTried: boolean }) {
  return <ComposeForm isPage={isPage} title={draft.title} onTitle={title => setDraft({ ...draft, title })} titlePlaceholder="항목 제목"
    titleError={isTried && !draft.title.trim() ? "제목을 입력해 주세요." : undefined}
    pillsError={isTried && !draft.folder ? "모음을 정해 주세요." : undefined}
    body={<RichDraft value={draft.body} onChange={body => setDraft({ ...draft, body })} isPage={isPage} />}
    pills={<>
      <OptionPill label="모음" icon="folder" isRequired isInvalid={isTried && !draft.folder} value={draft.folder} options={folders} onChange={folder => setDraft({ ...draft, folder })} />
      <DatePill label="다시 볼 날" value={draft.day} onChange={day => setDraft({ ...draft, day })} today="2026-11-07" />
    </>} />;
}

/** 열기 버튼과 대화상자. 크게 보기는 같은 초안으로 페이지 표면을 보인다(실제 주소 전환은 라우트 마스킹 견본). */
export function Composer({ startOpen = false }: { startOpen?: boolean }) {
  const [surface, setSurface] = useState<"closed" | "dialog" | "page">(startOpen ? "dialog" : "closed");
  const [draft, setDraft] = useState(empty);
  const [isTried, setTried] = useState(false);
  const close = () => { setDraft(empty); setTried(false); setSurface("closed"); };
  const submit = () => { if (!draft.title.trim() || !draft.folder) { setTried(true); focusFirstInvalid(); return; } close(); };
  if (surface === "closed") return <Button label="항목 추가" variant="create" icon={icon("plus")} onClick={() => setSurface("dialog")} />;
  return <ComposeSurface surface={surface} crumbs={[{ label: "작업 공간" }, { label: "새 항목" }]}
    chip={<PlaceChip mark={icon("folder")} label="작업 공간" />}
    isDirty={JSON.stringify(draft) !== JSON.stringify(empty)} onClose={close} onExpand={() => setSurface("page")}
    submit={{ label: "만들기", onSubmit: submit }}>
    <Form draft={draft} setDraft={setDraft} isPage={surface === "page"} isTried={isTried} />
  </ComposeSurface>;
}

function Steps() {
  const steps = ["한 일", "다음 계획", "확인"];
  const [step, setStep] = useState(0);
  const [parts, setParts] = useState<Record<string, JSONContent | undefined>>({});
  const body = (key: string) => <RichDraft key={key} value={parts[key]} onChange={value => setParts({ ...parts, [key]: value })} placeholder={`${key}을 적어 주세요`} />;
  return <ComposeSurface surface="page" crumbs={[{ label: "보고" }, { label: "주간 보고" }]} onClose={() => setStep(0)}
    previous={step > 0 ? { onClick: () => setStep(step - 1) } : undefined}
    submit={{ label: step === steps.length - 1 ? "제출" : "다음", onSubmit: () => setStep(Math.min(step + 1, steps.length - 1)) }}>
    <PaperForm heading="11월 첫째 주 보고" isPage
      about={<Stepper activeStep={step} label="작성 단계" density="compact" onStepClick={setStep}>{steps.map((label, index) => <Step key={label} step={index} label={label} />)}</Stepper>}
      parts={[{ label: "한 일", content: body("한 일") }, { label: "다음 계획", content: body("다음 계획") },
        { label: "확인", content: <>{["한 일", "다음 계획"].map(key => <p key={key}>{key}: {parts[key] ? "작성함" : "비어 있음"}</p>)}</> }].slice(step, step + 1)} />
  </ComposeSurface>;
}

const meta = {
  title: "Playground (플레이그라운드)/작성", id: "playground-creation",
  layout: "centered", height: "34rem",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Dialog: Sample = { name: "대화상자", render: () => <Composer /> };
export const Page: Sample = { name: "작성 페이지", layout: "fullscreen", height: "40rem", render: () => <LibrarySample initialPath="/resources/new" /> };
export const StepForm: Sample = { name: "단계형", layout: "fullscreen", render: () => <Steps /> };

