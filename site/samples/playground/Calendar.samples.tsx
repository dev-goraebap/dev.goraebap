import type { Meta, SampleOf } from "../catalog/types";
import { CalendarApp } from "./calendar/app/CalendarApp";

/**
 * 일정 앱: 날짜 격자가 주인공인 화면을 만들 때 본뜬다(일정·예약·근무표·편성표). 월·주 보기와 기준 날짜는 주소가 가지고,
 * 날짜 칸을 눌러 짧은 양식으로 만들며, 넘치는 일정은 "+N"으로 묶는다. 휴대폰은 월 격자 아래에 고른 날의 목록을 둔다.
 */
const meta = {
  title: "Playground (플레이그라운드)/일정", id: "playground-calendar", component: CalendarApp,
  layout: "fullscreen", height: "44rem", device: "desktop",
} satisfies Meta<typeof CalendarApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Month: Sample = { name: "월 보기", args: { initialPath: "/calendar" } };
export const Week: Sample = { name: "주 보기", args: { initialPath: "/calendar?view=week" } };
export const EventOpen: Sample = { name: "일정을 연 상태", args: { initialPath: "/calendar?view=week&date=2026-11-09&event=e05" } };

export const Create: Sample={name:"일정 만들기",args:{initialPath:"/calendar?panel=%2Fcalendar%2Fnew"}};
export const CreatePage: Sample={name:"일정 작성 페이지",args:{initialPath:"/calendar/new"}};
export const DetailPage: Sample={name:"일정 상세 페이지",args:{initialPath:"/calendar/events/e05"}};
