import type { Meta, SampleOf } from "../catalog/types";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { ListItem } from "@astryxdesign/core/List";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/VStack";
import { icon } from "@kit/foundations/icons/solar-icon";
import { AppFrame, type ShellLayout } from "@kit/layouts/app/AppFrame";
import type { NavSpace } from "@kit/layouts/app/nav";
import { Page } from "@kit/layouts/page/Page";
import { PageList } from "@kit/layouts/page/PageParts";
import { useState } from "react";
import { DemoBrand, demoAccount, demoSpace, rows } from "./demo";

export function Shell({ layout = "inset", space = demoSpace, rowCount = 8 }: { layout?: ShellLayout; space?: NavSpace; rowCount?: number }) {
  const [path, setPath] = useState(space.sections[0].entries[space.id === "main" ? 1 : 0].path);
  const [note, setNote] = useState("");
  return <AppFrame space={space} pathname={path} onNavigate={setPath} layout={layout} brand={isFolded => <DemoBrand isFolded={isFolded} />}
    headerTools={<Button label="검색" tooltip="검색" variant="box" size="sm" isIconOnly icon={icon("search")} />}
    phoneAppBar={<Avatar name="서윤" size="sm" shape="circle" />}>
    <Page crumbs={[{ label: "작업 공간" }, { label: "모든 항목" }]} create={{ label: "항목 추가", onClick: () => {} }}>
      <VStack padding={4}><TextArea label="검토 메모" value={note} onChange={setNote} placeholder="배치와 창 너비를 바꿔도 남는지 확인합니다" /></VStack>
      <PageList hasDividers aria-label="항목">
        {Array.from({ length: rowCount }, (_, index) => rows[index % rows.length]).map((label, index) => <ListItem key={index} label={label} href="#" />)}
      </PageList>
    </Page>
  </AppFrame>;
}

const meta = {
  title: "Layouts (레이아웃)/앱 셸", id: "layouts-app-shell",
  layout: "fullscreen", height: "38rem",
  device: "desktop",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Inset: Sample = { name: "Inset", render: () => <Shell /> };
export const Split: Sample = { name: "Split", render: () => <Shell layout="split" /> };
export const SubSpace: Sample = { name: "하위 메뉴 공간", render: () => <Shell space={demoAccount} /> };
export const LongList: Sample = { name: "긴 목록", render: () => <Shell rowCount={40} /> };
export const Phone: Sample = { name: "휴대폰", render: () => <Shell rowCount={20} />, device: "phone" };

