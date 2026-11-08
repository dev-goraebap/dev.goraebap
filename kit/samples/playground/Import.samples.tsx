import type { Meta, SampleOf } from "../catalog/types";
import { ImportApp } from "./import/app/ImportApp";

/**
 * 가져오기 앱: 파일을 받아 여러 단계를 거쳐 한꺼번에 들이는 화면을 만들 때 본뜬다(CSV·엑셀 가져오기, 데이터 이전, 일괄 등록).
 * 파일 올리기 → 열 맞추기(자동 짐작) → 미리보기(오류 행과 이유, 건너뛰기) → 진행과 결과(가져온 수·건너뛴 수, 오류 목록)로
 * 이어지며 단계는 주소가, 입력은 단계를 오가도 남는 작업 상태가 가진다. 파일은 실제로 읽지 않고 모의 데이터를 쓴다.
 */
const meta = {
  title: "Playground (플레이그라운드)/가져오기", id: "playground-import", component: ImportApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof ImportApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Upload: Sample = { name: "파일 고르기", args: { initialPath: "/import" } };
export const MapColumns: Sample = { name: "열 맞추기", args: { initialPath: "/import/map", preset: "file" } };
export const Preview: Sample = { name: "미리보기(오류 포함)", args: { initialPath: "/import/preview", preset: "file" } };
export const Result: Sample = { name: "결과", args: { initialPath: "/import/result", preset: "done" } };
