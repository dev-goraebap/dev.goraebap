import type { Meta, SampleOf } from "../catalog/types";
import { LibraryApp } from "../playground/library/app/LibraryApp";
import { createResourceApi } from "../playground/library/mocks/resource-api";
import { Button } from "@astryxdesign/core/Button";
import { BootCover } from "@kit/patterns/boot/BootCover";
import { useEffect, useState } from "react";

/** 첫 방문: 덮개가 앱 위에 있다가 첫 화면이 준비되면(여기서는 1.2초 뒤) 걷힌다. 다시 보기로 처음부터 본다. */
function FirstVisit() {
  const [round, setRound] = useState(0);
  const [isReady, setReady] = useState(false);
  useEffect(() => { setReady(false); const timer = window.setTimeout(() => setReady(true), 1200); return () => window.clearTimeout(timer); }, [round]);
  return <>
    <LibraryApp api={createResourceApi({ delay: 0 })} />
    <BootCover key={round} isReady={isReady} />
    <div style={{ position: "fixed", insetBlockEnd: 16, insetInlineEnd: 16, zIndex: 20 }}>
      <Button label="다시 보기" variant="secondary" size="sm" onClick={() => setRound(round + 1)} />
    </div>
  </>;
}

const meta = {
  title: "Patterns (사용 패턴)/데이터 상태", id: "patterns-data-states", component: LibraryApp,
  layout: "fullscreen", height: "34rem",
  device: "desktop",
} satisfies Meta<typeof LibraryApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Boot: Sample = { name: "첫 방문 덮개", render: () => <FirstVisit /> };
export const Waiting: Sample = { name: "첫 대기", render: () => <LibraryApp api={createResourceApi({ delay: 600_000 })} /> };
export const Failed: Sample = { name: "조회 실패", render: () => <LibraryApp api={createResourceApi({ fail: true, delay: 0 })} /> };
export const Empty: Sample = { name: "빈 목록", render: () => <LibraryApp api={createResourceApi({ initial: [], delay: 0 })} /> };
export const NoResults: Sample = { name: "조건에 맞는 것 없음", render: () => <LibraryApp api={createResourceApi({ delay: 0 })} initialPath="/resources?q=없는검색어" /> };
export const Missing: Sample = { name: "없는 대상", render: () => <LibraryApp api={createResourceApi({ delay: 0 })} initialPath="/resources/unknown" /> };

