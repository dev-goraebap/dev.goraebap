import { Link, useRouterState } from '@tanstack/react-router';
import { posts, readPostSearch } from '@/entities/post';
import { Badge } from '@/shared/ui/badge';

/**
 * 블로그 목록: 가운데 열(최대 62rem)에 글 카드 두 줄(휴대폰은 한 줄). 찾는 말과 태그는 주소에서 읽는다(툴바는 셸이 그린다).
 * 카드는 대표 이미지(16:9), 날짜, 제목, 설명, 태그 순이다.
 */
export function BlogPage() {
  const search = useRouterState({ select: state => state.location.searchStr });
  const { q, tags } = readPostSearch(search);
  const filtered = posts.filter(post => (!tags.length || tags.some(tag => post.tags?.includes(tag)))
    && `${post.title} ${post.description} ${post.tags?.join(' ')}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()));
  return <div className="mx-auto w-full max-w-248 px-8 py-10 max-md:px-4 max-md:py-6">
    <h1 className="sr-only">모든 글</h1>
    <p className="mb-4 text-[0.8125rem] text-muted-foreground" role="status">{filtered.length}개의 글</p>
    <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
      {filtered.map(post => <Link key={post.path} to={post.path}
        className="flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground outline-none transition-colors hover:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none">
        {post.cover ? <img src={post.cover} alt="" loading="lazy" width={640} height={360} className="aspect-video h-auto w-full border-b object-cover" /> : null}
        <div className="flex flex-col p-5">
          <time dateTime={post.date} className="text-xs text-muted-foreground">{post.date}</time>
          <h2 className="my-2 text-[1.2rem] leading-normal font-semibold tracking-[-0.02em]">{post.title}</h2>
          <p className="text-[0.9375rem] leading-[1.7] text-muted-foreground">{post.description}</p>
          {post.tags?.length ? <div className="mt-4 flex flex-wrap gap-2">{post.tags.map(value => <Badge key={value} variant="secondary">{value}</Badge>)}</div> : null}
        </div>
      </Link>)}
    </div>
    {filtered.length === 0 ? <p className="py-10 text-center text-muted-foreground">조건에 맞는 글이 없습니다. 검색어나 주제를 바꿔 보세요.</p> : null}
  </div>;
}
