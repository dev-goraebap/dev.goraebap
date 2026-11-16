import type { Meta, SampleOf } from "../catalog/types";

const meta = { title: "Foundations (디자인 기초)/글자", id: "foundations-typography", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 데스크톱 크기다. 휴대폰(64rem 미만)은 text-xs · sm · base가 13 · 15 · 17px로 한 단계씩 커진다. */
export const Scale: Sample = {
  name: "네 크기의 위계",
  render: () => <div className="flex w-[min(40rem,100vw-2rem)] flex-col gap-3 p-4">
    <h1 className="text-2xl font-semibold tracking-tight">읽기 편한 화면의 글자 리듬</h1>
    <p className="text-base font-semibold">작은 제목 · 15px</p>
    <p className="text-sm">본문과 행은 13px, 굵기 450, 줄 높이 1.5로 씁니다. 제목과 본문, 보조 정보가 각자의 목소리를 가집니다.</p>
    <p className="text-xs text-muted-foreground">보조 정보 · 서윤 · 11월 7일</p>
  </div>,
};

export const Numbers: Sample = {
  name: "숫자와 넘침",
  render: () => <div className="flex w-72 flex-col items-end gap-2 p-4 text-sm">
    {["1,204", "87", "12,930"].map(value => <span key={value} className="tabular-nums">{value}건</span>)}
    <span className="w-full truncate" title="아주 긴 제목이 목록에서는 한 줄에서 말줄임되고 전체는 따로 남습니다">아주 긴 제목이 목록에서는 한 줄에서 말줄임되고 전체는 따로 남습니다</span>
  </div>,
};
