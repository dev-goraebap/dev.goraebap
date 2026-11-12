import type { Meta, SampleOf } from "../catalog/types";
import { ActivityApp } from "./activity/app/ActivityApp";

/**
 * 활동 기록. 변경 기록·감사 로그·최근 활동처럼 시간순으로 읽기만 하는 목록을 만들 때 본뜬다. 날짜로 나누고 누가·무엇을·언제를
 * 한 줄에 보이며, 기간·사람·종류 조건은 주소가 가지고, 끝없이 불러오는 대신 더 보기로 조각씩 읽는다.
 */
const meta = {
  title: "Playground (플레이그라운드)/활동 기록", id: "playground-activity", component: ActivityApp,
  layout: "fullscreen", height: "38rem",
  device: "desktop",
} satisfies Meta<typeof ActivityApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Log: Sample = { name: "활동 기록", args: { initialPath: "/activity" } };
export const NoResults: Sample = { name: "조건 결과 없음", args: { initialPath: "/activity?period=today&actor=민준&type=delete" } };
