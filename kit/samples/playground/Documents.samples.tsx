import type { Meta, SampleOf } from "../catalog/types";
import { DocumentScreen, seededBody } from "./documents/DocumentScreen";
import { seeded, UploadScreen } from "./documents/UploadScreen";
import { LibrarySample } from "./library-sample";

/**
 * 문서함: 자료·문서를 모아 두고 골라 들어가 일하는 작업 목록. 문서 카드와 행 목록, 컬렉션, 작업 목록 미리보기(행 끝 버튼·Space),
 * 작성 페이지, 문서 편집(자동 저장), 파일 올리기를 다룬다. 지식 베이스·자료실·파일함을 만들 때 본뜬다.
 */
const meta = {
  title: "Playground (플레이그라운드)/문서함", id: "playground-documents",
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Cards: Sample = { name: "문서 카드", render: () => <LibrarySample initialPath="/resources?layout=grid" /> };
export const Rows: Sample = { name: "행 목록", render: () => <LibrarySample initialPath="/resources" /> };
export const Collection: Sample = { name: "컬렉션", render: () => <LibrarySample initialPath="/resources?collection=design" /> };
export const Peek: Sample = { name: "작업 목록 미리보기", render: () => <LibrarySample initialPath="/resources?peek=router" /> };
export const Compose: Sample = { name: "작성 페이지", render: () => <LibrarySample initialPath="/resources/new" /> };
export const Editing: Sample = { name: "문서 편집", render: () => <DocumentScreen title="화면 규칙 검토 메모" body={seededBody} /> };
export const Upload: Sample = { name: "파일 올리기", height: "36rem", render: () => <UploadScreen initial={seeded} /> };
