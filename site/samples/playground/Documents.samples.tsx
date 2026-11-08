import type { Meta, SampleOf } from "../catalog/types";
import { DocumentScreen, seededBody } from "./documents/DocumentScreen";
import { LibrarySample } from "./library-sample";

/** 가운데 컨테이너의 문서 카드·행 목록, 컬렉션과 작성·자동 저장 편집을 다룹니다. */
const meta = {
  title: "Playground (플레이그라운드)/문서함", id: "playground-documents",
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Cards: Sample = { name: "문서 카드", render: () => <LibrarySample initialPath="/resources?layout=grid" /> };
export const Rows: Sample = { name: "행 목록", render: () => <LibrarySample initialPath="/resources" /> };
export const Collection: Sample = { name: "컬렉션", render: () => <LibrarySample initialPath="/resources?collection=design" /> };
export const Compose: Sample = { name: "작성 페이지", render: () => <LibrarySample initialPath="/resources/new" /> };
export const Editing: Sample = { name: "문서 편집", render: () => <DocumentScreen title="화면 규칙 검토 메모" body={seededBody} /> };
