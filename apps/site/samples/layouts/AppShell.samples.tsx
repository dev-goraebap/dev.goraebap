import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { Meta, SampleOf } from "../catalog/types";
import { useShellLayout } from "../catalog/shell-layout";
import { AppShell, MeButton, type NavEntry, type NavSpace, type OpenGroups, type ShellLayout, type ShellMe } from "@/shared/ui/layout/app-shell";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Field, FieldLabel } from "@/shared/ui/field";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, FileTextIcon, LibraryIcon, LogoutIcon, SearchIcon, SettingsIcon, UserIcon } from "@/shared/ui/icon";
import { Page } from "@/shared/ui/layout/page";
import { RowLink } from "@/shared/ui/row-link";
import { Textarea } from "@/shared/ui/textarea";
import { DemoBrand, demoSpace, demoSpaces, globalSection, rows, type DemoSpace } from "./demo";

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

/** 주소의 첫 마디가 공간이다. 어느 공간에도 속하지 않는 화면(전역 묶음)은 마지막으로 있던 공간의 메뉴를 그대로 보인다. */
const spaceIdOf = (pathname: string) => demoSpaces.find(each => pathname.startsWith(`/${each.id}/`) || pathname === `/${each.id}`)?.id;

/** 사이드바 머리 왼쪽의 공간 전환 셀렉터: 지금 공간의 아이콘 · 이름 · ⇕, 누르면 공간을 고른다. 구분선 아래는 인스턴스 설정. */
function SpaceSwitcher({ current }: { current: DemoSpace }) {
  const navigate = useNavigate();
  const Current = current.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" aria-label={`공간: ${current.label}, 바꾸기`}
          className="h-8 gap-1.5 px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0">
          <Current chosen className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">{current.label}</span>
          <span aria-hidden className="flex flex-col text-icon-muted group-data-[collapsible=icon]:hidden [&_svg]:size-2.5">
            <ChevronUpIcon className="-mb-0.5" /><ChevronDownIcon className="-mt-0.5" />
          </span>
        </Button>
      } />
      <DropdownMenuContent align="start" className="min-w-40">
        {demoSpaces.map(each => (
          <DropdownMenuItem key={each.id} onClick={() => void navigate({ href: each.sections[0]!.entries[0]!.path })}>
            <each.icon chosen={each.id === current.id} />{each.label}{each.id === current.id && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ href: "/settings" })}><SettingsIcon />인스턴스 설정</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 공간이 둘인 앱 셸. 사이드바 머리 왼쪽은 정사각 로고 마크와 공간 전환 셀렉터, 오른쪽은 내 아바타. 메뉴 맨 위 이름표 없는 묶음
 * (찾기 · 알림함 · 내 항목)은 공간을 바꾸지 않는다. 공간의 관리 진입은 사이드바 맨 아래. 휴대폰 하단은 떠 있는 유리 막대(알림함과
 * 지금 공간의 핵심 메뉴 둘, 메뉴 시트 칸, 찾기 원)다.
 */
export function SpacesShell({ layout: chosen }: { layout?: ShellLayout }) {
  const guideLayout = useShellLayout();
  const layout = chosen ?? guideLayout;
  const pathname = useLocation({ select: location => location.pathname });
  // 마지막으로 있던 공간(앱은 세션에 기억한다): 전역 화면에서도 그 공간의 메뉴를 보인다.
  const last = useRef<DemoSpace["id"]>("work");
  last.current = spaceIdOf(pathname) ?? last.current;
  const space = demoSpaces.find(each => each.id === last.current)!;
  const toSpace = (each: DemoSpace): NavSpace => ({ id: each.id, title: each.label, sections: [globalSection(() => {}), ...each.sections] });
  const core: NavEntry[] = space.sections.flatMap(section => section.entries).slice(0, 2);
  return (
    <AppShell space={toSpace(space)} pathname={pathname} layout={layout} me={me} hasMeBox={false}
      brand={<>
        <Link to={"/work/items" as string} aria-label="처음으로" className="flex shrink-0 items-center pl-2 group-data-[collapsible=icon]:pl-0">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground"><LibraryIcon className="size-4" /></span>
        </Link>
        <SpaceSwitcher current={space} />
      </>}
      headerTools={<MeButton me={me} align="end" size="sm" />}
      adminEntries={[{ path: space.admin.path, label: space.admin.label, icon: SettingsIcon }]}
      phoneBar={{
        tabs: [globalSection(() => {}).entries[1]!, ...core],
        spaces: demoSpaces.map(each => ({ id: each.id, label: each.label, icon: each.icon, space: toSpace(each) })),
        currentSpaceId: space.id, onSearch: () => {},
      }}>
      <Page crumbs={[{ label: space.label }, { label: "모든 항목" }]} create={{ label: "항목 추가", onClick: () => {} }}>
        <ul aria-label="항목" className="flex flex-col">
          {rows.map((label, index) => (
            <li key={index} className="relative flex h-12 items-center gap-3 border-b bg-background px-4 hover:bg-row-hover">
              <FileTextIcon className="shrink-0 text-icon-muted" />
              <RowLink to={pathname} className="min-w-0 truncate">{label}</RowLink>
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
export const Spaces: Sample = { name: "공간 전환", path: "/work/items", render: () => <SpacesShell /> };
export const GlobalEntry: Sample = { name: "전역 묶음", path: "/notifications", render: () => <SpacesShell /> };
export const LongList: Sample = { name: "긴 목록", render: () => <Shell rowCount={40} /> };
