import type { Meta, SampleOf } from "../catalog/types";
import { LibrarySample } from "./library-sample";

/** 가운데 컨테이너의 문서 카드·행 목록, 컬렉션과 작성 페이지, 상세의 편집 단추가 여는 수정 화면(제목과 본문만)을 다룹니다. */
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
export const Detail: Sample = { name: "자료 상세", render: () => <LibrarySample initialPath="/resources/design-tokens" /> };
export const Editing: Sample = { name: "수정 화면", render: () => <LibrarySample initialPath="/resources/design-tokens/edit" /> };
