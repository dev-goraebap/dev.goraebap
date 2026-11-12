import { useState, type ReactNode } from "react";
import type { Meta, SampleOf } from "../catalog/types";
import { useIsMobile } from "@/shared/lib/use-mobile";
import { cn } from "@/shared/lib/utils";
import { ActionMenu } from "@/shared/ui/action-menu";
import { Alert, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterState } from "@/shared/ui/filter";
import { ArchiveIcon, FileTextIcon, FolderIcon, InboxIcon, InfoIcon, LinkIcon, PencilIcon, TriangleAlertIcon, UserIcon } from "@/shared/ui/icon";
import { Page, PageViews } from "@/shared/ui/page";
import { PersonAvatar } from "@/shared/ui/person-avatar";
import { OptionPill } from "@/shared/ui/property-pill";
import { DetailLayout } from "@/shared/ui/reading";
import { RowLink } from "@/shared/ui/row-link";
import { SearchTool } from "@/shared/ui/search-tool";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { SettingsPage, SettingsRow, SettingsSection } from "@/shared/ui/settings";
import { Facts, WithPanel } from "@/shared/ui/side-panel";
import { Switch } from "@/shared/ui/switch";
import { Table as DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { rows } from "./demo";
import { ListMore } from "@/shared/ui/list-more"

/** 줄 링크의 주소. 견본 틀의 메모리 라우터는 어떤 주소든 이 견본을 그린다(사이트 라우터의 주소 타입과 무관해 글자로 둔다). */
const ITEMS: string = "/items";

type Row = { id: string; title: string; folder: string; owner: string; date: string };
const data: Row[] = rows.map((title, index) => ({ id: String(index), title, folder: ["디자인 참고", "개발 자료"][index % 2], owner: ["서윤", "지우", "도현"][index % 3], date: `11월 ${7 - index}일` }));

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. relative는 줄 링크(RowLink)가 줄 전체를 덮는 기준이다. */
const ROW_SURFACE = "relative bg-background hover:bg-row-hover";

type FilterKey = "owner";
const FILTERS = [{ key: "owner" as const, label: "담당", icon: UserIcon, options: ["서윤", "지우", "도현"].map(value => ({ value, label: value })) }];

function ListPage({ hasBanner = false }: { hasBanner?: boolean }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"open" | "archived">("open");
  const [words, setWords] = useState("");
  const [state, setState] = useState<FilterState<FilterKey>>({ owner: ["서윤"] });
  const filters = useFilters(FILTERS, { state, onStateChange: setState });
  return (
    <Page crumbs={[{ label: "작업 공간", href: "/workspace" }, { label: "모든 항목", icon: InboxIcon }]}
      views={<PageViews label="보기" value={tab} onChange={setTab} isCompact={isMobile}
        views={[{ value: "open", label: "진행 중", icon: InboxIcon }, { value: "archived", label: "보관함", icon: ArchiveIcon }]} />}
      tools={<>
        <SearchTool label="항목 검색" value={words} onChange={setWords} />
        <FilterMenu filters={filters} />
      </>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}
      actions={<ActionMenu label="페이지 메뉴" actions={[{ label: "링크 복사", icon: LinkIcon, onSelect: () => {} }]} />}
      create={{ label: "항목 추가", onClick: () => {} }}>
      {hasBanner && (
        <Alert className="rounded-none border-x-0 border-t-0 px-4 py-2.5">
          <TriangleAlertIcon />
          <AlertTitle>보관한 모음이라 읽기만 할 수 있습니다</AlertTitle>
        </Alert>
      )}
      <ul aria-label="항목" className="flex flex-col">
        {data.map(row => (
          <li key={row.id} className={cn("flex h-12.25 items-center gap-3 border-b px-4 compact:h-10.25 max-md:h-auto max-md:py-3", ROW_SURFACE)}>
            <FileTextIcon className="shrink-0 text-icon-muted" />
            <RowLink to={ITEMS} className="min-w-0 flex-1 truncate font-medium">{row.title}</RowLink>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground max-md:hidden">
              <Badge variant="label">{row.folder}</Badge>
              <span className="flex items-center gap-1.5"><PersonAvatar name={row.owner} />{row.owner}</span>
              <span className="tabular-nums">{row.date}</span>
            </span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums md:hidden">{row.date}</span>
          </li>
        ))}
      </ul>
      <ListMore shown={8} total={24} unit="개" hasMore onMore={() => {}} hasFab />
    </Page>
  );
}

/**
 * 표. 줄 어디를 눌러도 열린다: 제목 칸의 단추가 ::after로 줄 전체를 덮는다(RowLink와 같은 방식, 여기는 주소 대신 동작).
 * 데스크톱 전용이며 휴대폰은 같은 내용을 줄 목록으로 보인다.
 */
export function TablePage() {
  const [opened, setOpened] = useState<string>();
  return (
    <Page crumbs={[{ label: "작업 공간" }, { label: "표" }]}>
      {opened && (
        <Alert className="rounded-none border-x-0 border-t-0 px-4 py-2.5">
          <InfoIcon />
          <AlertTitle>열었습니다: {opened}</AlertTitle>
        </Alert>
      )}
      <DataTable className="table-fixed bg-background">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 pl-4 text-muted-foreground">제목</TableHead>
            <TableHead className="w-30 text-muted-foreground">모음</TableHead>
            <TableHead className="w-25 text-muted-foreground">담당</TableHead>
            <TableHead className="w-25 pr-4 text-right text-muted-foreground">수정일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id} className={ROW_SURFACE}>
              <TableCell className="h-12.25 pl-4 compact:h-10.25">
                <button type="button" onClick={() => setOpened(row.title)}
                  className="block max-w-full truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
                  {row.title}
                </button>
              </TableCell>
              <TableCell className="truncate">{row.folder}</TableCell>
              <TableCell className="truncate">{row.owner}</TableCell>
              <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">{row.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </Page>
  );
}

const LONG_TITLE = "아주 긴 제목이 상세에서 가로로 넘치지 않고 줄을 바꾸는지 확인하는 항목";

function DetailPage() {
  const [folder, setFolder] = useState("design");
  const [owner, setOwner] = useState<string>();
  return (
    <Page crumbs={[{ label: "작업 공간", href: "/workspace" }, { label: "디자인 참고", href: "/workspace/design" }, { label: LONG_TITLE }]} isFullScreen
      actions={<ActionMenu label="항목 메뉴" actions={[{ label: "수정", icon: PencilIcon, onSelect: () => {} }]} />}>
      <DetailLayout label={`항목 ${LONG_TITLE}`} head={<span className="text-sm text-muted-foreground">디자인 참고</span>} title={LONG_TITLE}
        sections={[{ title: "속성", items: <>
          <OptionPill label="모음" icon={FolderIcon} value={folder} onChange={setFolder}
            options={[{ value: "design", label: "디자인 참고", icon: <FolderIcon /> }, { value: "dev", label: "개발 자료", icon: <FolderIcon /> }]} />
          <OptionPill label="담당" icon={UserIcon} value={owner} onChange={setOwner} emptyText="담당 없음"
            options={[{ value: "a", label: "서윤", icon: <PersonAvatar name="서윤" /> }]} />
        </> }]}>
        <div className="flex flex-col gap-3 leading-relaxed">
          <p className="wrap-anywhere">https://example.com/a-very-long-address-without-any-space-that-must-wrap-inside-the-reading-column-instead-of-pushing-the-page</p>
          <p>본문은 읽기 열 안에서 줄을 바꿉니다. 상세의 폭이 60rem 이상이면 속성이 오른쪽 열로 옮겨 갑니다.</p>
        </div>
      </DetailLayout>
    </Page>
  );
}

const densities = [{ value: "comfortable", label: "여유 있게" }, { value: "compact", label: "촘촘하게" }];

function Settings() {
  const [notify, setNotify] = useState(true);
  const [density, setDensity] = useState("comfortable");
  return (
    <SettingsPage crumbs={[{ label: "설정" }, { label: "화면" }]} title="화면 설정">
      <SettingsSection title="표시">
        <SettingsRow label="목록 높이" description="모든 페이지의 목록과 표에 적용합니다.">
          <Select items={densities} value={density} onValueChange={next => next && setDensity(next)}>
            <SelectTrigger aria-label="목록 높이" className="min-w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>{densities.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="알림"><Switch aria-label="새 항목 알림" checked={notify} onCheckedChange={setNotify} /></SettingsRow>
        <SettingsRow label="버전"><span className="text-muted-foreground tabular-nums">1.0.0</span></SettingsRow>
      </SettingsSection>
    </SettingsPage>
  );
}

function Panel() {
  const [chosen, setChosen] = useState<Row | undefined>(data[0]);
  return (
    <Page crumbs={[{ label: "관리" }, { label: "기록" }]}>
      <WithPanel title={chosen?.title} subtitle={chosen?.date} onClose={() => setChosen(undefined)}
        panel={chosen ? <Facts facts={[["모음", chosen.folder], ["담당", chosen.owner], ["수정일", chosen.date]]} /> : undefined}>
        <ul aria-label="기록" className="flex flex-col">
          {data.map(row => (
            <li key={row.id} className={cn("flex h-12.25 items-center border-b px-4 aria-[current=true]:bg-pressed max-md:h-14", ROW_SURFACE)}
              aria-current={row.id === chosen?.id || undefined}>
              <button type="button" aria-pressed={row.id === chosen?.id} onClick={() => setChosen(row)}
                className="min-w-0 flex-1 truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
                {row.title}
              </button>
            </li>
          ))}
        </ul>
      </WithPanel>
    </Page>
  );
}

/** 앱 셸 없이 페이지만 보이는 견본의 틀. 셸의 본문(main)처럼 높이를 정해 페이지 본문이 스스로 스크롤하게 한다. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col overflow-hidden">{children}</div>;
}

const meta = {
  title: "Layouts (레이아웃)/페이지", id: "layouts-page",
  layout: "fullscreen", height: "34rem",
  device: "desktop", kit: "shadcn", path: "/items",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const HeaderAndToolbar: Sample = { name: "머리 줄·툴바·목록", render: () => <Frame><ListPage /></Frame> };
export const Banner: Sample = { name: "페이지 배너", render: () => <Frame><ListPage hasBanner /></Frame> };
export const Table: Sample = { name: "표", render: () => <Frame><TablePage /></Frame> };
export const Detail: Sample = { name: "상세", render: () => <Frame><DetailPage /></Frame> };
export const SettingsScreen: Sample = { name: "설정", render: () => <Frame><Settings /></Frame> };
export const SidePanel: Sample = { name: "옆 패널", render: () => <Frame><Panel /></Frame> };
