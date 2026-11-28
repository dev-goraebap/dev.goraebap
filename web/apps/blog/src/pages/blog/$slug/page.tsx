import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { BLOG_MENU, ContentArticle, menuDocs } from "@/entities/content-doc";
import { useRegisterMobileToc } from "@/shared/lib/mobile-doc-bar";
import { PageState, TableOfContents, extractHeadingsFromMarkdown } from "@/shared/ui";
import { skillPageHref } from "@/pages/lib/skill-pages";

export const Route = createFileRoute("/blog/$slug/")({
  component: BlogPostPage,
});

// Blog 글 한 편: 스택이 없어서 스택 선택기와 스택 주소가 없다.
function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = menuDocs(BLOG_MENU).find((doc) => doc.slug === slug);
  const headings = useMemo(() => extractHeadingsFromMarkdown(post?.source ?? ""), [post?.source]);
  useRegisterMobileToc(headings);

  if (!post) {
    return (
      <PageState
        kind="not-found"
        title="글을 찾을 수 없습니다"
        action={
          <Link to="/blog" className={buttonVariants({ variant: "outline", size: "sm" })}>
            블로그 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl items-start justify-center gap-12 px-6 py-12">
      <div className="min-w-0 flex-1 max-w-3xl space-y-6">
        {post.meta.date && (
          <time dateTime={post.meta.date} className="text-muted-foreground block text-sm">
            {post.meta.date}
          </time>
        )}
        {post.meta.thumbnail && (
          <div className="corner-squircle overflow-hidden rounded-[22px]">
            <img
              src={post.meta.thumbnail}
              alt={post.meta.title ?? post.slug}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}
        <ContentArticle doc={post} stack="" skillHref={skillPageHref} />
      </div>

      {headings.length > 0 && (
        <aside
          aria-label="글 목차"
          className="hidden w-52 shrink-0 xl:sticky xl:top-[calc(3.5rem+2.5rem)] xl:block"
        >
          <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TableOfContents items={headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
