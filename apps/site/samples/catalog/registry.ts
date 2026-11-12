import type { Device, Kit, Layout, Meta, Sample, SampleModule } from "./types";

/** 모든 견본 파일. 필요한 파일만 불러온다. */
const loaders = import.meta.glob<SampleModule>("../**/*.samples.tsx");

export type SampleEntry = {
  /** "묶음 id/견본 키" (예: playground-peek/open) */
  id: string;
  group: string;
  key: string;
  name: string;
  layout: Layout;
  height?: string;
  device: Device;
  /** 견본 틀이 깔 키트(types.ts의 Kit). 묶음의 meta.kit, 없으면 astryx. */
  kit: Kit;
};

/** 옮기는 동안의 기본은 astryx다. 견본 틀(SampleView)과 견본 iframe(SampleFrame)이 같은 판단을 쓰도록 여기 하나만 둔다. */
export const kitOf = (meta: Meta): Kit => meta.kit ?? "astryx";

const kebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export function samplesOf(module: SampleModule): (SampleEntry & { sample: Sample; meta: Meta })[] {
  const meta = module.default;
  return Object.entries(module)
    .filter(([key, value]) => key !== "default" && typeof value === "object")
    .map(([key, value]) => {
      const sample = value as Sample;
      return {
        id: `${meta.id}/${kebab(key)}`, group: meta.id, key, name: sample.name,
        layout: sample.layout ?? meta.layout ?? "centered", height: sample.height ?? meta.height,
        device: sample.device ?? meta.device ?? "desktop", kit: kitOf(meta), sample, meta,
      };
    });
}

export async function loadAll() {
  const modules = await Promise.all(Object.values(loaders).map(load => load()));
  return modules.flatMap(samplesOf);
}

/** 묶음 id는 파일 위치에서 정해진다: `patterns/RouteMasking.samples.tsx` → `patterns-route-masking`. */
export const groupOfPath = (path: string) => {
  const [, dir, file] = path.match(/([^/]+)\/([^/]+)\.samples\.tsx$/) ?? [];
  return `${dir}-${kebab(file ?? "")}`;
};

/** 견본 파일 원문. 모듈 이름공간은 내보내기를 알파벳순으로 주므로, 파일에 쓴 순서는 원문에서 읽는다. */
const sources = import.meta.glob<string>("../**/*.samples.tsx", { query: "?raw", import: "default" });

/** 묶음 하나의 견본을 파일에 쓴 순서대로. */
export async function loadGroup(group: string) {
  const entry = Object.entries(loaders).find(([path]) => groupOfPath(path) === group);
  if (!entry) return [];
  const [module, text] = await Promise.all([entry[1](), sources[entry[0]]?.() ?? Promise.resolve("")]);
  const written = [...text.matchAll(/^export const (\w+)/gm)].map(match => match[1]);
  const position = (key: string) => (written.indexOf(key) + 1 || 999);
  return samplesOf(module).sort((a, b) => position(a.key) - position(b.key));
}

/** 견본 하나만 그 파일을 불러와 찾는다. */
export async function loadSample(id: string) {
  const group = id.split("/")[0];
  const entry = Object.entries(loaders).find(([path]) => groupOfPath(path) === group);
  return entry ? samplesOf(await entry[1]()).find(sample => sample.id === id) : undefined;
}
