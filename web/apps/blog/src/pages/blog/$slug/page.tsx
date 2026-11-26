import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { BLOG_MENU, ContentArticle, menuDocs } from "@/entities/content-doc";
import { PageState } from "@/shared/ui";
import { skillPageHref } from "@/pages/lib/skill-pages";

export const Route = createFileRoute("/blog/$slug/")({
  component: BlogPostPage,
});

// Blog 글 한 편: 스택이 없어서 스택 선택기와 스택 주소가 없다.
function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = menuDocs(BLOG_MENU).find((doc) => doc.slug === slug);

  if (!post) {
    return (
      <PageState
        kind="not-found"
        title="글을 찾을 수 없습니다"
        action={
          <Link to="/blog" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Blog 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {post.meta.date && (
        <time dateTime={post.meta.date} className="text-muted-foreground mb-4 block text-sm">
          {post.meta.date}
        </time>
      )}
      <ContentArticle doc={post} stack="" skillHref={skillPageHref} />
    </div>
  );
}
