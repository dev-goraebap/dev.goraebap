// 빌드 시점에 견본 목록과 틀 정보(높이·기기·배치)를 읽는다. 견본을 그리는 일은 iframe 안의 SampleFrame이 맡는다.
import { groupOfPath, loadAll } from '@frontend/catalog/registry';

// 모듈 이름공간은 내보내기를 알파벳순으로 돌려주므로, 견본 파일에 쓴 순서는 원문에서 읽는다.
const sources = import.meta.glob<string>('../../frontend/src/**/*.samples.tsx', { query: '?raw', import: 'default', eager: true });
const written = new Map(Object.entries(sources).flatMap(([path, text]) =>
  [...text.matchAll(/^export const (\w+)/gm)].map((match, index) => [`${groupOfPath(path)}:${match[1]}`, index] as const)));
const position = (entry: { group: string; key: string }) => written.get(`${entry.group}:${entry.key}`) ?? 999;

const loaded = loadAll().then((list) => list
  .map(({ sample, meta, ...entry }) => ({ ...entry, title: meta.title }))
  .sort((a, b) => a.group.localeCompare(b.group) || position(a) - position(b)));
export type SampleInfo = Awaited<typeof loaded>[number];

export const allSamples = () => loaded;

export async function sampleInfo(id: string): Promise<SampleInfo> {
  const found = (await loaded).find((entry) => entry.id === id);
  if (!found) throw new Error(`견본이 없습니다: ${id}`);
  return found;
}

export async function groupSamples(group: string): Promise<SampleInfo[]> {
  const list = (await loaded).filter((entry) => entry.group === group);
  if (!list.length) throw new Error(`견본 묶음이 없습니다: ${group}`);
  return list;
}
