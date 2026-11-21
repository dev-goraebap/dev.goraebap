import { codeLinksOptions, columnsOptions, labelsOptions, timelineOptions, typesOptions, workItemOptions, workItemPath, workingPeopleOptions } from '@/entities/work-item';
import type { Prep } from '@/shared/lib/prepare';

/** 업무 하나의 첫 화면: 업무와 본문, 활동, 그리고 고르는 칸들(상태 · 유형 · 사람 · 라벨 · 코드 연결). */
export async function prepareWorkItem({ ensure, prime, body }: Prep, key: string, number: number) {
  if (!Number.isFinite(number)) return;
  const view = await ensure(workItemOptions(key, number));
  await Promise.all([body(`${workItemPath(view.issue.projectKey, view.issue.number)}/body`), prime(timelineOptions(key, number)),
    prime(columnsOptions(key)), prime(typesOptions()), prime(workingPeopleOptions()), prime(labelsOptions()), prime(codeLinksOptions(key, number))]);
}
