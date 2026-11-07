import type { Device, Layout, Meta, Sample, SampleModule } from "./types";

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
};

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
        device: sample.device ?? meta.device ?? "desktop", sample, meta,
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

/** 견본 하나만 그 파일을 불러와 찾는다. */
export async function loadSample(id: string) {
  const group = id.split("/")[0];
  const entry = Object.entries(loaders).find(([path]) => groupOfPath(path) === group);
  return entry ? samplesOf(await entry[1]()).find(sample => sample.id === id) : undefined;
}
