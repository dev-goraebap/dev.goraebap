import type { Meta, SampleOf } from "../catalog/types";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { icon, type IconName } from "@/shared/ui/foundations/icons/solar-icon";
import { SOLAR_ICONS } from "@/shared/ui/foundations/icons/solar-icons";
import { Comparison } from "../catalog/Comparison";
import styles from "./swatch.module.css";

const meta = { title: "Foundations (디자인 기초)/아이콘", id: "foundations-icons", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Selection: Sample = {
  name: "기본과 선택",
  render: () => <Comparison items={(["library", "star", "folder", "filter", "layout-list", "more"] as IconName[]).map(name => ({
    label: name, content: <HStack gap={3}>{icon(name)}{icon(name, true)}</HStack>,
  }))} />,
};

export const Names: Sample = {
  name: "의미 이름 목록",
  render: () => <ul className={styles.grid} aria-label="아이콘">
    {(Object.keys(SOLAR_ICONS) as IconName[]).map(name => <li key={name} className={styles.row}>{icon(name)}<Text type="supporting">{name}</Text></li>)}
  </ul>,
};
