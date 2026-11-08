import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack } from "@astryxdesign/core/HStack";
import { ListItem } from "@astryxdesign/core/List";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { FileDropzone } from "@kit/composites/upload/FileDropzone";
import { icon } from "@kit/foundations/icons/solar-icon";
import { AppFrame } from "@kit/layouts/app/AppFrame";
import { Page } from "@kit/layouts/page/Page";
import { PageList } from "@kit/layouts/page/PageParts";
import { useEffect, useRef, useState } from "react";
import { DemoBrand, demoSpace } from "../../layouts/demo";
import styles from "../playground.module.css";

type Upload = { id: string; name: string; size: number; state: "waiting" | "uploading" | "done" | "failed"; progress: number };

const sizeText = (bytes: number) => bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;

/**
 * 가짜 올리기: 한 번에 두 개씩 올리고, 이름에 "실패"가 든 파일은 중간에 실패한다. 실제 업로드 수명주기(서명 주소,
 * 재개, 취소)는 제품 계약이 정한다. 이 견본은 화면이 각 상태를 어떻게 보이는지만 다룬다.
 */
function useUploads(initial: Upload[]) {
  const [items, setItems] = useState(initial);
  const latest = useRef(items);
  latest.current = items;
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = latest.current;
      const running = current.filter(item => item.state === "uploading").length;
      let starts = Math.max(0, 2 - running);
      setItems(current.map(item => {
        if (item.state === "waiting" && starts > 0) { starts -= 1; return { ...item, state: "uploading", progress: 0 }; }
        if (item.state !== "uploading") return item;
        const progress = Math.min(100, item.progress + 12);
        if (item.name.includes("실패") && progress >= 60) return { ...item, state: "failed", progress };
        return progress >= 100 ? { ...item, state: "done", progress } : { ...item, progress };
      }));
    }, 400);
    return () => window.clearInterval(timer);
  }, []);
  const add = (files: File[]) => setItems(list => [...list, ...files.map(file => ({ id: `${file.name}-${file.size}-${Math.random()}`, name: file.name, size: file.size, state: "waiting" as const, progress: 0 }))]);
  const retry = (id: string) => setItems(list => list.map(item => item.id === id ? { ...item, state: "waiting", progress: 0, name: item.name.replace("실패", "") } : item));
  const remove = (id: string) => setItems(list => list.filter(item => item.id !== id));
  return { items, add, retry, remove };
}

/** 행 끝: 상태마다 하나의 표시. 올리는 중은 진행 막대, 끝나면 완료 라벨, 실패면 다시 시도와 빼기. */
function UploadRow({ item, onRetry, onRemove }: { item: Upload; onRetry: () => void; onRemove: () => void }) {
  // 완료는 행 끝 라벨로만 알리고, 나머지 상태는 크기 옆에 적는다.
  const state = item.state === "waiting" ? "대기 중" : item.state === "uploading" ? `올리는 중 ${item.progress}%` : item.state === "failed" ? "올리지 못했습니다" : undefined;
  return <ListItem label={<Text weight="medium" maxLines={1}>{item.name}</Text>}
    description={<Text type="supporting" color="secondary" className={item.state === "failed" ? styles.failed : undefined}>{sizeText(item.size)}{state ? ` · ${state}` : ""}</Text>}
    startContent={<span className={styles.fileMark}>{icon(item.name.match(/\.(png|jpe?g|webp|gif)$/i) ? "image" : "document")}</span>}
    endContent={<HStack gap={1} vAlign="center" className={styles.uploadEnd}>
      {item.state === "uploading" ? <span className={styles.uploadBar}><ProgressBar label={`${item.name} 올리는 중`} isLabelHidden value={item.progress} /></span> : null}
      {item.state === "done" ? <Token label="완료" size="sm" color="green" /> : null}
      {item.state === "failed" ? <IconButton label={`${item.name} 다시 올리기`} tooltip="다시 시도" variant="ghost" size="sm" icon={icon("retry")} onClick={onRetry} /> : null}
      {item.state !== "uploading" ? <IconButton label={`${item.name} 빼기`} tooltip="빼기" variant="ghost" size="sm" icon={icon("close")} onClick={onRemove} /> : null}
    </HStack>} />;
}

/** 자료 올리기 화면: 읽는 폭(약 720px) 열에 올리기 칸, 그 아래 파일별 상태와 요약. */
export function UploadScreen({ initial = [] }: { initial?: Upload[] }) {
  const { items, add, retry, remove } = useUploads(initial);
  const done = items.filter(item => item.state === "done").length;
  const failed = items.filter(item => item.state === "failed").length;
  return <AppFrame space={demoSpace} pathname="/items" brand={isFolded => <DemoBrand isFolded={isFolded} />}>
    <Page crumbs={[{ label: "작업 공간" }, { label: "자료 올리기" }]} isDetail hasPattern={false}>
      <VStack className={styles.column} gap={4}>
        <FileDropzone label="파일 올리기" multiple accept="image/*,.pdf,.docx" maxBytes={20 * 1024 ** 2} hint="이미지·PDF·워드, 파일당 최대 20MB" onPick={add} />
        {items.length ? <VStack gap={2}>
          <Text type="supporting" color="secondary" role="status">
            {items.length}개 중 {done}개 완료{failed ? ` · ${failed}개 실패` : ""}
          </Text>
          <PageList hasDividers aria-label="올리는 파일">
            {items.map(item => <UploadRow key={item.id} item={item} onRetry={() => retry(item.id)} onRemove={() => remove(item.id)} />)}
          </PageList>
        </VStack> : null}
      </VStack>
    </Page>
  </AppFrame>;
}

export const seeded: Upload[] = [
  { id: "a", name: "화면 배치 스케치.png", size: 2_400_000, state: "done", progress: 100 },
  { id: "b", name: "회의 기록.pdf", size: 830_000, state: "uploading", progress: 40 },
  { id: "c", name: "실패하는 표본.docx", size: 120_000, state: "waiting", progress: 0 },
  { id: "d", name: "참고 이미지.jpg", size: 5_600_000, state: "waiting", progress: 0 },
];
