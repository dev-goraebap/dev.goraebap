import type { Meta, SampleOf } from "../catalog/types";
import { DocumentEditorApp } from "./document-editor/app/DocumentEditorApp";

/**
 * 문서 편집기. 정의서·보고서·계약서처럼 종이(A4)로 나가는 문서를 쓰고 읽는 화면을 만들 때 본뜬다. 위에 늘 붙은 서식 막대,
 * 페이지(종이 위에 페이지마다)와 페이지 없음(한 열) 전환, 페이지 끝을 넘는 블록·문단 줄·표 행을 다음 페이지로 넘기는 페이지 나누기,
 * 페이지 목록, 화면과 같은 경계의 인쇄를 다룬다. 부품은 shared/ui/document다.
 */
const meta = {
  title: "Playground (플레이그라운드)/문서 편집기", id: "playground-document-editor", component: DocumentEditorApp,
  layout: "fullscreen", height: "46rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof DocumentEditorApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Editing: Sample = { name: "페이지 위에 쓰기", args: { initialPath: "/documents/spec/edit" } };
export const Reading: Sample = { name: "페이지로 읽기", args: { initialPath: "/documents/spec" } };
