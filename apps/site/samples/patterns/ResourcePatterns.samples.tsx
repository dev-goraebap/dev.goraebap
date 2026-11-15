import type { Meta, SampleOf } from "../catalog/types";
import { CalendarApp } from "../playground/calendar/app/CalendarApp";
import { InboxApp } from "../playground/inbox/app/InboxApp";
import { IssuesApp } from "../playground/issues/app/IssuesApp";

/**
 * 리소스 하나의 목록 · 상세 · 생성 · 수정을 어디에 띄우고 어떻게 오가는지의 세 패턴. 따로 화면을 만들지 않고 Playground 앱을
 * 그 상태로 띄운다. List-Detail은 인박스(목록과 오른쪽 칸), Drill-down은 이슈(목록과 각자의 페이지), Routed Modal은 일정
 * (격자 위 대화상자)이다. 휴대폰에서는 셋 모두 그 페이지로 간다.
 */
const meta = {
  title: "Patterns (사용 패턴)/리소스 패턴", id: "patterns-resource-patterns",
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const ListDetail: Sample = { name: "List-Detail (목록-상세 분할)", render: () => <InboxApp initialPath="/inbox/n1" /> };
export const ListDetailIdle: Sample = { name: "List-Detail: 고르기 전", render: () => <InboxApp initialPath="/inbox" /> };
export const DrillDown: Sample = { name: "Drill-down (페이지 이동형)", render: () => <IssuesApp initialPath="/issues" /> };
export const DrillDownDetail: Sample = { name: "Drill-down: 상세 페이지", render: () => <IssuesApp initialPath="/issues/ISS-12" /> };
export const RoutedModal: Sample = {
  name: "Routed Modal (목록 위 대화상자)",
  render: () => <CalendarApp initialPath="/calendar?view=week&date=2026-11-09&panel=%2Fcalendar%2Fevents%2Fe05" />,
};
