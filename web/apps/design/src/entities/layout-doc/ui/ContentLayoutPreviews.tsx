import type { ReactNode } from "react";
import { LayoutSlot as Slot } from "./LayoutSlot";

const PAGE_HEADER = "h-[52px] shrink-0";
const TOOLBAR = "h-11 shrink-0";

function Stack({ children }: { children: ReactNode }) {
  return <div className="bg-background flex h-full flex-col gap-2 p-2">{children}</div>;
}

export function ListPreview() {
  return (
    <Stack>
      <Slot label="Page Header" className={PAGE_HEADER} />
      <Slot label="Toolbar" className={TOOLBAR} />
      <Slot label="List" className="flex-1" />
    </Stack>
  );
}

export function ListViewsExample() {
  return (
    <Stack>
      <Slot label="Page Header" className={PAGE_HEADER} />
      <div className="flex h-11 shrink-0 gap-2">
        <Slot label="View Tabs" className="flex-1" />
        <Slot label="Tools" className="w-24 shrink-0 @3xl:w-44" />
      </div>
      <Slot label="List" className="flex-1" />
    </Stack>
  );
}

export function ListFiltersExample() {
  return (
    <Stack>
      <Slot label="Page Header" className={PAGE_HEADER} />
      <Slot label="Toolbar" className={TOOLBAR} />
      <Slot label="Applied Filters" className="h-9 shrink-0" />
      <Slot label="List" className="flex-1" />
    </Stack>
  );
}

export function TableFooterExample() {
  return (
    <Stack>
      <Slot label="Page Header" className={PAGE_HEADER} />
      <Slot label="Toolbar" className={TOOLBAR} />
      <Slot label="Table Head" className={TOOLBAR} />
      <Slot label="Rows" className="flex-1" />
      <Slot label="List Footer" className={TOOLBAR} />
    </Stack>
  );
}

function SplitPanes({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="bg-background flex h-full gap-2 p-2">
      <div className="flex w-full min-w-0 flex-col gap-2 @5xl:w-80 @5xl:shrink-0">{list}</div>
      <div className="hidden min-w-0 flex-1 flex-col gap-2 @5xl:flex">{detail}</div>
    </div>
  );
}

export function ListDetailPreview() {
  return (
    <SplitPanes
      list={<Slot label="List" className="flex-1" />}
      detail={<Slot label="Detail" className="flex-1" />}
    />
  );
}

export function ListDetailHeadersExample() {
  return (
    <SplitPanes
      list={
        <>
          <Slot label="List Header" className={PAGE_HEADER} />
          <Slot label="Toolbar" className={TOOLBAR} />
          <Slot label="List" className="flex-1" />
        </>
      }
      detail={
        <>
          <Slot label="Pane Header" className={PAGE_HEADER} />
          <Slot label="Detail" className="flex-1" />
        </>
      }
    />
  );
}

export function ListDetailTabsExample() {
  return (
    <SplitPanes
      list={
        <>
          <Slot label="List Header" className={PAGE_HEADER} />
          <Slot label="List" className="flex-1" />
        </>
      }
      detail={
        <>
          <Slot label="Pane Header" className={PAGE_HEADER} />
          <Slot label="Tabs" className={TOOLBAR} />
          <Slot label="Tab Panel" className="flex-1" />
        </>
      }
    />
  );
}

function ReadingLayout({ reading, aside }: { reading: ReactNode; aside: ReactNode }) {
  return (
    <div className="bg-background flex h-full flex-col gap-2 p-2 @min-[60rem]:flex-row @min-[60rem]:justify-center">
      <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col gap-2 @min-[60rem]:order-1 @min-[60rem]:max-w-[45rem]">
        {reading}
      </div>
      <div className="order-1 flex shrink-0 flex-col gap-2 @min-[60rem]:order-2 @min-[60rem]:w-64">
        {aside}
      </div>
    </div>
  );
}

export function DetailPropertiesPreview() {
  return (
    <ReadingLayout
      reading={<Slot label="Reading Column" className="flex-1" />}
      aside={<Slot label="Properties" className="h-12 @min-[60rem]:h-auto @min-[60rem]:flex-1" />}
    />
  );
}

export function DetailActivityExample() {
  return (
    <ReadingLayout
      reading={
        <>
          <Slot label="Title" className="h-16 shrink-0" />
          <Slot label="Body" className="flex-1" />
          <Slot label="Activity" className="h-24 shrink-0" />
        </>
      }
      aside={<Slot label="Properties" className="h-12 @min-[60rem]:h-auto @min-[60rem]:flex-1" />}
    />
  );
}

export function DetailOutlineExample() {
  return (
    <ReadingLayout
      reading={<Slot label="Reading Column" className="flex-1" />}
      aside={
        <>
          <Slot label="Outline" className="hidden h-32 shrink-0 @min-[60rem]:flex" />
          <Slot label="Properties" className="h-12 @min-[60rem]:h-auto @min-[60rem]:flex-1" />
          <Slot label="Info" className="hidden h-24 shrink-0 @min-[60rem]:flex" />
        </>
      }
    />
  );
}

function SettingsColumn({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 justify-center">
      <div className="flex w-full max-w-[45rem] min-w-0 flex-col gap-2">{children}</div>
    </div>
  );
}

export function SettingsPreview() {
  return (
    <div className="bg-background flex h-full flex-col p-2">
      <SettingsColumn>
        <Slot label="Title" className="h-14 shrink-0" />
        <Slot label="Section" className="flex-1" />
        <Slot label="Section" className="flex-1" />
      </SettingsColumn>
    </div>
  );
}

export function SettingsRowsExample() {
  return (
    <div className="bg-background flex h-full flex-col p-2">
      <SettingsColumn>
        <Slot label="Title" className="h-14 shrink-0" />
        <Slot label="Section Name" className="h-7 shrink-0" />
        {["Name", "Language", "Time Zone"].map((label) => (
          <div key={label} className="flex min-h-0 flex-1 gap-2">
            <Slot label={label} className="flex-1" />
            <Slot label="Value" className="w-28 shrink-0 @3xl:w-56" />
          </div>
        ))}
      </SettingsColumn>
    </div>
  );
}

export function FormPreview() {
  return (
    <div className="bg-background flex h-full flex-col gap-2 p-2">
      <SettingsColumn>
        <Slot label="Title" className="h-14 shrink-0" />
        <Slot label="Form" className="flex-1" />
        <Slot label="Actions" className="h-11 shrink-0" />
      </SettingsColumn>
    </div>
  );
}

export function FormSectionsExample() {
  return (
    <div className="bg-background flex h-full flex-col p-2">
      <SettingsColumn>
        <Slot label="Title" className="h-14 shrink-0" />
        <Slot label="Section 1" className="h-7 shrink-0" />
        <div className="grid flex-1 grid-cols-1 gap-2 @3xl:grid-cols-2">
          <Slot label="Field" />
          <Slot label="Field" />
        </div>
        <Slot label="Section 2" className="h-7 shrink-0" />
        <Slot label="Field" className="flex-1" />
      </SettingsColumn>
    </div>
  );
}

export function FormActionsExample() {
  return (
    <div className="bg-background flex h-full flex-col gap-2 p-2">
      <SettingsColumn>
        <Slot label="Title" className="h-14 shrink-0" />
        <Slot label="Form" className="flex-1" />
      </SettingsColumn>
      <Slot label="Action Bar" className="h-14 shrink-0" />
    </div>
  );
}
