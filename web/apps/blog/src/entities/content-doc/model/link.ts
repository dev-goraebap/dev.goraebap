import { docHref, findDocByFile } from "./content";

// content 글의 링크는 저장소 안의 실제 파일을 가리킨다. 사이트에서는 그 파일을 옮긴 페이지 주소로 바꾼다.
// content에 없는 스킬 파일(plugins/webapp/skills/...)은 그 지침을 다루는 사이트 페이지로 잇고, 없으면 링크 없이 글자만 보인다.

const APP = "/web/apps/blog";
const SKILLS = "/plugins/webapp/skills/";

function join(from: string, href: string) {
  const parts = `${APP}${from}`.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

export type SkillHref = (skillPath: string) => string | undefined;

export function resolveHref(
  from: string,
  href: string,
  stack: string,
  skillHref: SkillHref,
): string | undefined {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  if (href.startsWith("/")) return href;
  const [path, anchor] = href.split("#");
  const target = join(from, path);
  if (target.startsWith(`${APP}/content/`)) {
    const contentPath = target.slice(APP.length);
    const diataxis = /^\/content\/(frontend|backend)\/(playbooks|articles|reference)\/([^/]+)(?:\/([^/]+))?\.md$/.exec(
      contentPath,
    );
    if (diataxis) {
      const [, space, section, slug, variant] = diataxis;
      const query = variant && variant !== "index" ? `?stack=${encodeURIComponent(variant)}` : "";
      return `/${space}/${section}/${slug}${query}${anchor ? `#${anchor}` : ""}`;
    }
    const doc = findDocByFile(contentPath);
    return doc ? docHref(doc, stack) + (anchor ? `#${anchor}` : "") : undefined;
  }
  if (target.startsWith(SKILLS)) return skillHref(target.slice(SKILLS.length));
  return undefined;
}
