import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { Meta, SampleOf } from "../catalog/types";
import { useShellLayout } from "../catalog/shell-layout";
import { AppShell, type NavSpace, type OpenGroups, type ShellLayout, type ShellMe } from "@/shared/ui/app-shell";
import { Button } from "@/shared/ui/button";
import { DropdownMenuGroup, DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { Field, FieldLabel } from "@/shared/ui/field";
import { FileTextIcon, LogoutIcon, SearchIcon, UserIcon } from "@/shared/ui/icon";
import { Page } from "@/shared/ui/page";
import { RowLink } from "@/shared/ui/row-link";
import { Textarea } from "@/shared/ui/textarea";
import { DemoBrand, demoAccount, demoSpace, rows } from "./demo";

/** 줄 링크의 주소. 견본 틀의 메모리 라우터는 어떤 주소든 이 견본을 그린다(사이트 라우터의 주소 타입과 무관해 글자로 둔다). */
const ITEMS: string = "/items";

const me: ShellMe = {
  name: "서윤", detail: "디자인 팀",
  menu: <DropdownMenuGroup>
    <DropdownMenuItem><UserIcon />내 정보</DropdownMenuItem>
    <DropdownMenuItem><LogoutIcon />나가기</DropdownMenuItem>
  </DropdownMenuGroup>,
};

/**
 * 앱 셸 견본. 견본 틀의 메모리 라우터가 주소를 가지므로 메뉴를 누르면 주소가 바뀌고, 셸은 그 주소로 지금 항목을 정한다.
 * 메모 칸은 배치(inset · split)와 창 너비(64rem 분기)를 바꿔도 본문이 다시 마운트되지 않는지 보려는 것이다.
 */
export function Shell({ layout: chosen, space = demoSpace, rowCount = 8, openGroups }: {
  layout?: ShellLayout; space?: NavSpace; rowCount?: number; openGroups?: OpenGroups;
}) {
  const guideLayout = useShellLayout();
  const layout = chosen ?? guideLayout;
  const pathname = useLocation({ select: location => location.pathname });
  const [note, setNote] = useState("");
  return (
    <AppShell space={space} pathname={pathname} layout={layout} openGroups={openGroups} me={me} brand={isFolded => <DemoBrand isFolded={isFolded} />}
      headerTools={<Button variant="ghost" size="icon-sm" aria-label="검색" title="검색"><SearchIcon /></Button>}
      phoneTools={<Button variant="ghost" size="icon" aria-label="검색" className="size-11"><SearchIcon /></Button>}>
      <Page crumbs={[{ label: "작업 공간" }, { label: "모든 항목" }]} create={{ label: "항목 추가", onClick: () => {} }}>
        <div className="bg-background p-4">
          <Field>
            <FieldLabel htmlFor="shell-note">검토 메모</FieldLabel>
            <Textarea id="shell-note" value={note} onChange={event => setNote(event.target.value)} placeholder="배치와 창 너비를 바꿔도 남는지 확인합니다" />
          </Field>
        </div>
        <ul aria-label="항목" className="flex flex-col">
          {Array.from({ length: rowCount }, (_, index) => rows[index % rows.length]).map((label, index) => (
            <li key={index} className="relative flex h-12 items-center gap-3 border-b bg-background px-4 hover:bg-row-hover">
              <FileTextIcon className="shrink-0 text-icon-muted" />
              <RowLink to={ITEMS} className="min-w-0 truncate">{label}</RowLink>
            </li>
          ))}
        </ul>
      </Page>
    </AppShell>
  );
}

const meta = {
  title: "Layouts (레이아웃)/앱 셸", id: "layouts-app-shell",
  layout: "fullscreen", height: "38rem",
  device: "desktop", path: "/items",
} satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Inset: Sample = { name: "Inset", render: () => <Shell /> };
export const SubSpace: Sample = { name: "하위 메뉴 공간", path: "/account", render: () => <Shell space={demoAccount} /> };
export const LongList: Sample = { name: "긴 목록", render: () => <Shell rowCount={40} /> };
