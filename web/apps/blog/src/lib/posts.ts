import type { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";

export type PostCategory = "아키텍처" | "UI/UX" | "에이전트";
type PostStatus = "원칙" | "메모";

interface PostFrontmatter {
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  category: PostCategory;
  status: PostStatus;
  tags?: string[];
}

interface MdxPostModule {
  default: ComponentType<{ components?: MDXComponents }>;
  frontmatter: PostFrontmatter;
}

export interface PostEntry extends PostFrontmatter {
  slug: string;
  tags: string[];
  Content: ComponentType<{ components?: MDXComponents }>;
  raw: string;
}

const mdxModules = import.meta.glob<MdxPostModule>("../../content/posts/*.mdx", {
  eager: true,
});

const rawModules = import.meta.glob<string>("../../content/posts/*.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});

function slugFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() ?? filePath;
  return filename.replace(/\.mdx$/, "");
}

export const posts: PostEntry[] = Object.entries(mdxModules)
  .map(([path, mod]) => {
    const slug = slugFromPath(path);
    const fm = mod.frontmatter;
    return {
      slug,
      title: fm.title,
      summary: fm.summary,
      date: fm.date,
      readingTime: fm.readingTime,
      category: fm.category,
      status: fm.status,
      tags: fm.tags ?? [],
      Content: mod.default,
      raw: rawModules[path] ?? "",
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPostBySlug(slug: string): PostEntry | undefined {
  return posts.find((post) => post.slug === slug);
}
