import type { Meta, SampleOf } from "../catalog/types";
import { ApprovalApp } from "./approval/app/ApprovalApp";

/**
 * 결재 신청 앱: 여러 사람의 결정이 걸린 신청(휴가·지출·구매 승인)을 만들 때 본뜬다. 단계형 신청과 결재선 고르기, 내 신청 목록과
 * 진행 상태 타임라인, 결재할 사람의 승인·반려(반려는 이유 필수)가 한 앱에 있다.
 */
const meta = {
  title: "Playground (플레이그라운드)/결재 신청", id: "playground-approval", component: ApprovalApp,
  layout: "fullscreen", height: "40rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof ApprovalApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Request: Sample = { name: "신청 (첫 단계)", args: { initialPath: "/requests/new" } };
export const Line: Sample = { name: "결재선 단계", args: { initialPath: "/requests/new?step=line" } };
export const Progress: Sample = { name: "진행 중인 신청", args: { initialPath: "/requests/AP-5" } };
export const Decide: Sample = { name: "결재하기", args: { initialPath: "/requests/AP-8" } };
