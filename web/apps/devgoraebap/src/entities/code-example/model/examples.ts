// Webapp 플러그인 스킬의 예시 파일(skills/<스킬>/examples/<주제>.md)을 그대로 읽어 스택별 탭으로 나눈다.
// 형식은 plugins/webapp/scripts/check.mjs의 예시 검사와 goraebap-mode/references/examples.md를 따른다.

const FILES = import.meta.glob<string>("@webapp-skills/*/examples/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type ExampleBlock =
  | { kind: "source"; label: string; href: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "text"; text: string };

export interface ExampleStack {
  id: string;
  blocks: ExampleBlock[];
}

export interface CodeExample {
  // plugins/webapp/skills 기준 경로
  path: string;
  title: string;
  intro: string;
  // 첫 문단이 링크한 지침 파일. 같은 지침을 옮긴 사이트 문서가 이 예시를 보인다.
  rules: string[];
  stacks: ExampleStack[];
}

export const STACK_LABELS: Record<string, string> = {
  react: "React",
  angular: "Angular",
  spring: "Spring",
};

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const plain = (text: string) =>
  text
    .replace(LINK, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

function resolve(from: string, href: string) {
  const parts = from.split("/").slice(0, -1);
  for (const part of href.split("#")[0].split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}

function parseStack(body: string): ExampleBlock[] {
  const blocks: ExampleBlock[] = [];
  const pattern = /^```([a-z]+)\n([\s\S]*?)\n```$|^출처: \[([^\]]+)\]\(([^)]+)\)$/gm;
  let cursor = 0;
  const pushText = (text: string) => {
    for (const paragraph of text.split(/\n\s*\n/)) {
      const value = plain(paragraph);
      if (value) blocks.push({ kind: "text", text: value });
    }
  };
  for (const match of body.matchAll(pattern)) {
    pushText(body.slice(cursor, match.index));
    if (match[1]) blocks.push({ kind: "code", language: match[1], code: match[2] });
    else blocks.push({ kind: "source", label: match[3], href: match[4] });
    cursor = match.index + match[0].length;
  }
  pushText(body.slice(cursor));
  return blocks;
}

function parse(path: string, raw: string): CodeExample {
  const text = raw.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "");
  const [head, ...sections] = text.split(/^## /m);
  const title = head.match(/^# (.+)$/m)?.[1].trim() ?? path;
  const intro = head.replace(/^# .+$/m, "").trim();
  const rules = [...intro.matchAll(LINK)]
    .map(([, , href]) => href)
    .filter((href) => !/^https?:/.test(href))
    .map((href) => resolve(path, href));
  return {
    path,
    title,
    intro: plain(intro),
    rules,
    stacks: sections.map((section) => {
      const newline = section.indexOf("\n");
      return {
        id: section.slice(0, newline).trim(),
        blocks: parseStack(section.slice(newline + 1)),
      };
    }),
  };
}

export const CODE_EXAMPLES: CodeExample[] = Object.entries(FILES)
  .map(([file, raw]) => parse(file.slice(file.indexOf("/skills/") + "/skills/".length), raw))
  .sort((a, b) => a.path.localeCompare(b.path));

// 사이트 문서가 옮긴 지침(skills 값)을 링크한 예시
export function examplesFor(skills: string[] = []) {
  return CODE_EXAMPLES.filter((example) => example.rules.some((rule) => skills.includes(rule)));
}
