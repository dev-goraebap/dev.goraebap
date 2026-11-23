import type { ComponentDocSpec } from "../model/catalog";
import type { ComponentGuide } from "../model/guides";

// 페이지에 보이는 순서대로 모아야 용어의 첫 언급을 정확히 고를 수 있다.
export function collectGuideTexts(doc: ComponentDocSpec, guide: ComponentGuide) {
  const texts: [string, string][] = [["usage", guide.usage]];
  guide.anatomy?.forEach((part, index) => texts.push([`anatomy.${index}`, part.role]));
  doc.examples?.forEach((example) => {
    if (example.description) texts.push([`example.${example.id}`, example.description]);
  });
  guide.accessibility.keys.forEach((item, index) => texts.push([`key.${index}`, item.action]));
  guide.accessibility.notes.forEach((note, index) => texts.push([`note.${index}`, note]));
  return texts;
}
