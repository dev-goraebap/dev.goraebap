import type { Meta, SampleOf } from "../catalog/types";
import { FoldersApp } from "./folders/app/FoldersApp";

/**
 * 폴더 탐색 앱: 계층 구조를 오가는 화면을 만들 때 본뜬다(파일·문서 보관함, 카테고리 관리, 조직도). 왼쪽 나무와 오른쪽 내용을
 * 나란히 두고, 머리 줄 경로로 위로 가며, 항목은 끌거나 "옮기기" 메뉴로 옮긴다. 휴대폰은 나무 없이 한 단계씩 들어간다.
 */
const meta = {
  title: "Playground (플레이그라운드)/폴더 탐색", id: "playground-folders", component: FoldersApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof FoldersApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Browse: Sample = { name: "폴더 탐색", args: { initialPath: "/folders/design" } };
export const Empty: Sample = { name: "빈 폴더", args: { initialPath: "/folders/archive" } };
