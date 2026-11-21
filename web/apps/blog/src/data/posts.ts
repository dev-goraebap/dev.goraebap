export type PostCategory = "아키텍처" | "UI/UX" | "에이전트";
type PostStatus = "원칙" | "메모";

interface PostSection {
  heading: string;
  paragraphs: string[];
  quote?: string;
  code?: {
    filename: string;
    content: string;
  };
}

export interface Post {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  category: PostCategory;
  status: PostStatus;
  tags: string[];
  sections: PostSection[];
}

export const posts: Post[] = [
  {
    slug: "blog-as-agent-context",
    title: "블로그 글을 에이전트의 맥락으로 쓰는 법",
    summary:
      "압축된 규칙(skills) 뒤에 깔린 개발 철학과 판단 근거를 에세이로 쌓고, 사람과 에이전트가 같은 원문을 읽게 만드는 구조.",
    date: "2026-11-21",
    readingTime: "4분",
    category: "에이전트",
    status: "원칙",
    tags: ["context", "workflow", "markdown"],
    sections: [
      {
        heading: "규칙만으로는 설명되지 않는 경계",
        paragraphs: [
          "개발 지침(skills)은 실행 시점에 빠르게 판단할 수 있도록 짧고 단호해야 합니다. 하지만 실제 제품 설계에서는 규칙에 딱 떨어지지 않는 애매한 선택이 훨씬 자주 찾아옵니다.",
          "그때 필요한 것은 '무엇을 하라'는 체크리스트가 아니라 '왜 이쪽을 선호하는가'에 대한 가치관과 트레이드오프 기록입니다. 블로그 글은 사람에게 읽히기 위해 쓰는 동시에, 에이전트에게 판단의 결을 전달하는 가장 자연스러운 매체가 됩니다.",
        ],
        quote:
          "skills가 실행을 위한 헌법이라면, 블로그는 그 헌법이 만들어진 배경과 가치관을 담은 해설서입니다.",
      },
      {
        heading: "상시 주입 대신 색인 기반 온디맨드 조회",
        paragraphs: [
          "블로그 글을 시스템 프롬프트에 통째로 넣으면 토큰이 금세 비대해지고, 6개월 전 실험 메모가 현재 규칙과 충돌하는 문제가 생깁니다. 그래서 모든 글은 frontmatter에 status와 요약을 두고, 필요할 때만 관련 글 1~2편을 꺼내 읽도록 설계합니다.",
        ],
        code: {
          filename: "content/posts/blog-as-agent-context.md",
          content: `---
title: "블로그 글을 에이전트의 맥락으로 쓰는 법"
date: "2026-11-21"
category: "에이전트"
status: "active" # active | evolving | outdated
summary: "규칙 뒤에 깔린 판단 근거를 에세이로 정리하고 온디맨드로 참조한다."
---`,
        },
      },
    ],
  },
  {
    slug: "single-source-shadcn-monorepo",
    title: "shadcn 커스텀 레지스트리를 모노레포 단일 원본으로 관리하기",
    summary:
      "앱이 직접 import하는 packages/ui를 곧바로 shadcn build의 원본으로 삼아, 사본과 어긋남 없이 디자인 시스템을 운영하는 방법.",
    date: "2026-11-20",
    readingTime: "5분",
    category: "UI/UX",
    status: "원칙",
    tags: ["shadcn", "monorepo", "design-system"],
    sections: [
      {
        heading: "뼈대는 공유하고, 피부와 조합은 앱이 소유한다",
        paragraphs: [
          "블로그처럼 여백과 타이포가 중요한 에디토리얼 사이트와, 업무 도구처럼 정보 밀도와 빠른 조작이 중요한 앱은 겉모습이 달라야 합니다. 모든 앱을 똑같은 테마로 묶으면 결국 예외 코드가 쌓입니다.",
          "packages/ui에는 접근성과 동작이 검증된 기본 부품과 CSS 변수 이름표만 두고, 색상·폰트·모서리 반경 같은 피부는 각 앱의 index.css에서 덮어씁니다. 앱 전용 조합은 그 앱 안에 두고, 두 번 이상 쓰일 때만 공통 패키지로 올립니다.",
        ],
      },
      {
        heading: "별도 빌드 없는 JIT 패키지 + 정적 레지스트리 출력",
        paragraphs: [
          "내부 앱들은 packages/ui의 소스를 직접 import해 즉시 HMR을 누리고, 외부 프로젝트가 필요할 때는 registry.json에서 정적 JSON을 생성해 블로그의 /r 경로로 바로 서빙합니다.",
        ],
        code: {
          filename: "web/package.json",
          content: `{
  "scripts": {
    "dev:blog": "pnpm --filter @goraebap/blog dev",
    "build:registry": "pnpm --filter @goraebap/ui build:registry",
    "check": "pnpm lint && pnpm format:check && pnpm knip && pnpm typecheck && pnpm build"
  }
}`,
        },
      },
    ],
  },
  {
    slug: "start-with-modular-monolith",
    title: "모듈형 모놀리스에서 출발하고, 경계는 테스트로 지킨다",
    summary:
      "초기부터 마이크로서비스나 큐를 도입하는 대신, 하나의 배포 단위 안에서 컨텍스트 경계와 공개 계약만 단단하게 유지하는 기준.",
    date: "2026-11-17",
    readingTime: "6분",
    category: "아키텍처",
    status: "메모",
    tags: ["architecture", "boundaries", "pragmatism"],
    sections: [
      {
        heading: "구체적인 운영 비용이 확인되기 전에는 쪼개지 않는다",
        paragraphs: [
          "DB와 배포 단위를 미리 나누면 트랜잭션 경계, 아웃박스, 백업 시점 불일치 같은 분산 시스템 비용을 첫날부터 떠안게 됩니다. 반대로 경계 없이 한 덩어리로 짜면 몇 달 뒤 손대기 어려운 스파게티가 됩니다.",
          "해법은 배포와 DB는 하나로 두되, 코드의 참조 방향과 다른 컨텍스트의 테이블 접근을 자동화된 테스트로 강제하는 것입니다. 나중에 정말 분리가 필요해질 때 떼어낼 수 있는 상태만 유지하면 충분합니다.",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function serializePostToMarkdown(post: Post): string {
  const frontmatter = [
    "---",
    `title: "${post.title}"`,
    `date: "${post.date}"`,
    `category: "${post.category}"`,
    `status: "${post.status === "원칙" ? "active" : "evolving"}"`,
    `tags: [${post.tags.map((t) => `"${t}"`).join(", ")}]`,
    `summary: "${post.summary}"`,
    "---",
  ].join("\n");

  const body = post.sections
    .map((section) => {
      const parts = [`## ${section.heading}`, ...section.paragraphs];
      if (section.quote) {
        parts.push(`> ${section.quote}`);
      }
      if (section.code) {
        parts.push("```" + `\n// ${section.code.filename}\n${section.code.content}\n` + "```");
      }
      return parts.join("\n\n");
    })
    .join("\n\n");

  return `${frontmatter}\n\n# ${post.title}\n\n${body}\n`;
}
