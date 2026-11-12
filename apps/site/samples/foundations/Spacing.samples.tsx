import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { icon } from "@/shared/ui/foundations/icons/solar-icon";
import { Comparison } from "../catalog/Comparison";
import styles from "./swatch.module.css";

const meta = { title: "Foundations (디자인 기초)/간격과 크기", id: "foundations-spacing", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

const steps = ["0-5", "1", "1-5", "2", "3", "4", "5", "6", "8", "10", "12"];
export const Scale: Sample = {
  name: "간격 토큰",
  render: () => <ul className={styles.grid} aria-label="간격">
    {steps.map(step => <li key={step} className={styles.row}>
      <span className={styles.name}>--spacing-{step}</span><span className={styles.bar} style={{ inlineSize: `var(--spacing-${step})` }} />
    </li>)}
  </ul>,
};

export const Controls: Sample = {
  name: "컨트롤 크기",
  render: () => <Comparison items={[
    { label: "sm", content: <Button label="저장" size="sm" /> },
    { label: "md · 도구", content: <Button label="검색" size="md" variant="tool" isIconOnly icon={icon("search")} /> },
    { label: "lg", content: <Button label="저장" size="lg" /> },
    { label: "입력 칸", content: <TextInput label="이름" isLabelHidden placeholder="이름" value="" onChange={() => {}} width="10rem" /> },
  ]} />,
};
