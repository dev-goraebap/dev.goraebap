import type { Meta, SampleOf } from "../catalog/types";
import { Text } from "@astryxdesign/core/Text";
import { Comparison } from "../catalog/Comparison";
import styles from "./swatch.module.css";

const meta = { title: "Foundations (디자인 기초)/면과 경계", id: "foundations-surfaces", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Levels: Sample = {
  name: "네 단계의 면",
  render: () => <section className={styles.floor} aria-label="바닥">
    <Text type="supporting" color="secondary">바닥</Text>
    <div className={styles.surface} data-pattern>
      <Text type="supporting" color="secondary">페이지 면 · 점 무늬</Text>
      <div className={styles.card}><Text>올린 면 · 카드</Text></div>
      <div className={styles.pop}><Text>뜬 면 · 메뉴</Text></div>
    </div>
  </section>,
};

export const Radius: Sample = {
  name: "모서리",
  render: () => <Comparison items={[
    ["8px 입력", "0.5rem"], ["10px 메뉴 항목", "0.625rem"], ["12px 팝오버", "0.75rem"], ["16px 카드", "1rem"], ["알약", "999px"],
  ].map(([label, radius]) => ({ label, content: <span className={styles.radius} style={{ borderRadius: radius, cornerShape: radius === "1rem" || radius === "0.625rem" ? "squircle" : undefined } as never} /> }))} />,
};
