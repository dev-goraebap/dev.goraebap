import { useRouterState } from '@tanstack/react-router';
import { posts } from '@/entities/post';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import styles from './blog.module.css';

export function BlogPage() {
  const search = useRouterState({ select: state => state.location.searchStr });
  const query = new URLSearchParams(search);
  const q = query.get('q') ?? '';
  const tag = query.get('tag') ?? '';
  const filtered = posts.filter(post => (!tag || post.tags?.includes(tag)) && `${post.title} ${post.description} ${post.tags?.join(' ')}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()));
  return <div className={styles.home}>
    <p className={styles.count} role="status">{filtered.length}개의 글</p>
    <div className={styles.posts}>{filtered.map(post => <RouterLink key={post.path} href={post.path} className={styles.post}>
      {post.cover ? <img src={post.cover} alt="" loading="lazy" width={640} height={360} /> : null}
      <div className={styles.summary}><time dateTime={post.date}>{post.date}</time><h2>{post.title}</h2><p>{post.description}</p><div className={styles.tags}>{post.tags?.map(value => <span key={value}>{value}</span>)}</div></div>
    </RouterLink>)}</div>
    {filtered.length === 0 ? <p className={styles.empty}>조건에 맞는 글이 없습니다. 검색어나 주제를 바꿔 보세요.</p> : null}
  </div>;
}
