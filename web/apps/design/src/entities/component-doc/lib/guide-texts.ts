import type { ComponentDocSpec } from "../model/catalog";
import type { ComponentGuide } from "../model/guides";

// 플레이그라운드의 옵션으로 흡수된 예제는 따로 보여 주지 않는다.
const ABSORBED_EXAMPLES = new Set(["pill", "shape", "size"]);

export function getVisibleExamples(doc: ComponentDocSpec) {
  return doc.examples?.filter((example) => !ABSORBED_EXAMPLES.has(example.id)) ?? [];
}

// 페이지에 보이는 순서대로 모아야 용어의 첫 언급을 정확히 고를 수 있다.
export function collectGuideTexts(doc: ComponentDocSpec, guide: ComponentGuide) {
  const texts: [string, string][] = [["usage", guide.usage]];
  guide.anatomy?.forEach((part, index) => texts.push([`anatomy.${index}`, part.role]));
  getVisibleExamples(doc).forEach((example) => {
    if (example.description) texts.push([`example.${example.id}`, example.description]);
  });
  guide.accessibility.keys.forEach((item, index) => texts.push([`key.${index}`, item.action]));
  guide.accessibility.notes.forEach((note, index) => texts.push([`note.${index}`, note]));
  return texts;
}
