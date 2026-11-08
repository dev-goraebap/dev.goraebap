import type { Meta, SampleOf } from "../catalog/types";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { ListItem } from "@astryxdesign/core/List";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { pixel, proportional } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { useFilters } from "@kit/composites/filter/use-filters";
import { RowMenu } from "@kit/composites/popup/RowMenu";
import { OptionPill } from "@kit/composites/property/PropertyPill";
import { SearchTool } from "@kit/composites/search/SearchTool";
import { icon } from "@kit/foundations/icons/solar-icon";
import { DetailLayout } from "@kit/layouts/detail/DetailLayout";
import { Page } from "@kit/layouts/page/Page";
import { PageBanner, PageList, PageMore, PageTable, useOpenRows } from "@kit/layouts/page/PageParts";
import { PageViews } from "@kit/layouts/page/PageToolbar";
import { SettingsField, SettingsPage, SettingsSection } from "@kit/layouts/settings/Settings";
import { Facts, WithPanel } from "@kit/layouts/side-panel/WithPanel";
import { useState } from "react";
import { rows } from "./demo";

type Row = { id: string; title: string; folder: string; owner: string; date: string };
const data: Row[] = rows.map((title, index) => ({ id: String(index), title, folder: ["디자인 참고", "개발 자료"][index % 2], owner: ["서윤", "지우", "도현"][index % 3], date: `11월 ${7 - index}일` }));

function ListPage({ hasBanner = false }: { hasBanner?: boolean }) {
  const [tab, setTab] = useState("open");
  const [words, setWords] = useState("");
  const [state, setState] = useState<Record<string, string[]>>({ owner: ["서윤"] });
  const list = useFilters([{ key: "owner", label: "담당", icon: "user", isMultiple: true, options: ["서윤", "지우", "도현"].map(value => ({ value, label: value })) }], { state, onStateChange: setState });
  return <Page crumbs={[{ label: "작업 공간", href: "#" }, { label: "모든 항목" }]}
    views={<PageViews value={tab} onChange={setTab} views={[{ id: "open", label: "진행 중", icon: "inbox" }, { id: "archived", label: "보관함", icon: "archive" }]} />}
    tools={<><SearchTool label="항목 검색" value={words} onChange={setWords} />{list.tools}</>}
    applied={list.applied} pageActions={<RowMenu label="페이지 메뉴" actions={[{ id: "copy", label: "링크 복사", icon: "link" }]} />}
    create={{ label: "항목 추가", onClick: () => {} }}>
    {hasBanner ? <PageBanner status="warning" title="보관한 모음이라 읽기만 할 수 있습니다" /> : null}
    <PageList hasDividers aria-label="항목">
      {data.map(row => <ListItem key={row.id} href="#" label={<Text weight="medium" maxLines={1}>{row.title}</Text>}
        startContent={icon("document")}
        endContent={<HStack gap={2} vAlign="center"><Token label={row.folder} size="sm" href="#" />
          <HStack gap={1.5} vAlign="center"><Avatar name={row.owner} size="xsm" shape="circle" /><Text type="supporting">{row.owner}</Text></HStack>
          <Text type="supporting" color="secondary" hasTabularNumbers>{row.date}</Text></HStack>} />)}
    </PageList>
    <PageMore shown={8} total={24} unit="개" hasMore isLoading={false} onMore={() => {}} />
  </Page>;
}

export function TablePage() {
  const [opened, setOpened] = useState<string>();
  const open = useOpenRows<Row>(row => setOpened(row.title));
  return <Page crumbs={[{ label: "작업 공간" }, { label: "표" }]}>
    {opened ? <PageBanner status="info" title={`열었습니다: ${opened}`} /> : null}
    <PageTable<Row> data={data} hasHover plugins={open} textOverflow="truncate" columns={[
      { key: "title", header: "제목", width: proportional(1) },
      { key: "folder", header: "모음", width: pixel(120) },
      { key: "owner", header: "담당", width: pixel(100) },
      { key: "date", header: "수정일", width: pixel(100), align: "end", renderCell: row => <Text hasTabularNumbers>{row.date}</Text> },
    ]} />
  </Page>;
}

function DetailPage() {
  const [folder, setFolder] = useState("design");
  return <Page crumbs={[{ label: "작업 공간", href: "#" }, { label: "디자인 참고", href: "#" }, { label: "아주 긴 제목이 상세에서 가로로 넘치지 않고 줄을 바꾸는지 확인하는 항목" }]}
    isDetail hasHeading={false} pageActions={<RowMenu label="항목 메뉴" actions={[{ id: "edit", label: "수정", icon: "edit" }]} />}>
    <DetailLayout label="항목" head={<Text type="supporting" color="secondary">디자인 참고</Text>}
      title={<Heading level={1}>아주 긴 제목이 상세에서 가로로 넘치지 않고 줄을 바꾸는지 확인하는 항목</Heading>}
      sections={[{ title: "속성", items: <>
        <OptionPill label="모음" icon="folder" value={folder} onChange={setFolder} options={[{ value: "design", label: "디자인 참고" }, { value: "dev", label: "개발 자료" }]} />
        <OptionPill label="담당" icon="user" value={undefined} onChange={() => {}} options={[{ value: "a", label: "서윤" }]} emptyText="담당 없음" />
      </> }]}>
      <Text>https://example.com/a-very-long-address-without-any-space-that-must-wrap-inside-the-reading-column-instead-of-pushing-the-page</Text>
      <Text>본문은 읽기 열 안에서 줄을 바꿉니다. 컨테이너가 60rem 이상이면 속성이 오른쪽 열로 옮겨 갑니다.</Text>
    </DetailLayout>
  </Page>;
}

function Settings() {
  const [notify, setNotify] = useState(true);
  return <SettingsPage crumbs={[{ label: "설정" }, { label: "화면" }]} title="화면 설정">
    <SettingsSection title="표시">
      <SettingsField label="목록 높이" description="모든 페이지의 목록과 표에 적용합니다.">
        <Selector label="목록 높이" isLabelHidden value="comfortable" options={[{ value: "comfortable", label: "여유 있게" }, { value: "compact", label: "촘촘하게" }]} />
      </SettingsField>
      <SettingsField label="알림"><Switch label="새 항목 알림" isLabelHidden value={notify} onChange={setNotify} /></SettingsField>
      <SettingsField label="버전" isValue><Text color="secondary">1.0.0</Text></SettingsField>
    </SettingsSection>
  </SettingsPage>;
}

function Panel() {
  const [chosen, setChosen] = useState<Row | undefined>(data[0]);
  return <Page crumbs={[{ label: "관리" }, { label: "기록" }]}>
    <WithPanel title={chosen?.title} subtitle={chosen?.date} onClose={() => setChosen(undefined)}
      panel={chosen ? <Facts facts={[["모음", chosen.folder], ["담당", chosen.owner], ["수정일", chosen.date]]} /> : undefined}>
      <PageList hasDividers aria-label="기록">
        {data.map(row => <ListItem key={row.id} label={row.title} isSelected={row.id === chosen?.id} onClick={() => setChosen(row)} />)}
      </PageList>
    </WithPanel>
  </Page>;
}

const meta = {
  title: "Layouts (레이아웃)/페이지", id: "layouts-page",
  layout: "fullscreen", height: "34rem",
  device: "desktop",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const HeaderAndToolbar: Sample = { name: "머리 줄·툴바·목록", render: () => <ListPage /> };
export const Banner: Sample = { name: "페이지 배너", render: () => <ListPage hasBanner /> };
export const Table: Sample = { name: "표", render: () => <TablePage /> };
export const Detail: Sample = { name: "상세", render: () => <DetailPage /> };
export const SettingsScreen: Sample = { name: "설정", render: () => <Settings /> };
export const SidePanel: Sample = { name: "옆 패널", render: () => <Panel /> };

