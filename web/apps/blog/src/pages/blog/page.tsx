import { Link, createFileRoute } from "@tanstack/react-router";
import { blogPosts, docHref } from "@/entities/content-doc";

export const Route = createFileRoute("/blog/")({
  component: BlogListPage,
});

// Blog 글 목록: 날짜가 늦은 것부터.
function BlogListPage() {
  const posts = blogPosts();
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          왜 이렇게 만드는지에 대한 생각과 리서치
        </p>
      </header>
      <ul className="divide-border divide-y">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <Link to={docHref(post, "")} className="group block space-y-2">
              {post.meta.date && (
                <time dateTime={post.meta.date} className="text-muted-foreground text-sm">
                  {post.meta.date}
                </time>
              )}
              <h2 className="text-xl font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
                {post.meta.title ?? post.slug}
              </h2>
              {post.meta.summary && (
                <p className="text-muted-foreground leading-7">{post.meta.summary}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
