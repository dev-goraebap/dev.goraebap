export type ExampleBlock =
  | { kind: "source"; label: string; href: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "text"; text: string };

export interface ExampleStack {
  id: string;
  blocks: ExampleBlock[];
}

export interface CodeExample {
  path: string;
  title: string;
  intro: string;
  rules: string[];
  stacks: ExampleStack[];
}

export const STACK_LABELS: Record<string, string> = {
  react: "React",
  angular: "Angular",
  spring: "Spring",
};

export const CODE_EXAMPLES: CodeExample[] = [];

export function examplesFor(skills: string[] = []) {
  return CODE_EXAMPLES.filter((example) => example.rules.some((rule) => skills.includes(rule)));
}
