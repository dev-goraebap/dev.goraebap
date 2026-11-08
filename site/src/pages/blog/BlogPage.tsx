import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { posts, postTags } from '@/entities/post';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import styles from './blog.module.css';

export function BlogPage() {
  const router = useRouter();
  const search = useRouterState({ select: state => state.location.searchStr });
  const query = new URLSearchParams(search);
  const q = query.get('q') ?? '';
  const tag = query.get('tag') ?? '';
  const filtered = posts.filter(post => (!tag || post.tags?.includes(tag)) && `${post.title} ${post.description} ${post.tags?.join(' ')}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()));
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value); else next.delete(key);
    void router.navigate({ href: `/blog/${next.size ? `?${next}` : ''}`, replace: true });
  };
  return <div className={styles.home}>
    <header className={styles.intro}><p className={styles.eyebrow}>dev-goraebap · Blog</p><h1>개발 기록</h1><p>설계의 이유와 구현하며 배운 것들을 기록합니다.</p></header>
    <div className={styles.tools}>
      <TextInput label="글 검색" isLabelHidden placeholder="제목, 내용 소개, 태그 검색" type="text" value={q} onChange={value => update('q', value)} />
      <Selector label="주제" value={tag} options={[{ value: '', label: '모든 주제' }, ...postTags.map(value => ({ value, label: value }))]} onChange={value => update('tag', value)} />
    </div>
    <p className={styles.count} role="status">{filtered.length}개의 글</p>
    <div className={styles.posts}>{filtered.map(post => <RouterLink key={post.path} href={post.path} className={styles.post}>
      {post.cover ? <img src={post.cover} alt="" loading="lazy" width={640} height={360} /> : null}
      <div className={styles.summary}><time dateTime={post.date}>{post.date}</time><h2>{post.title}</h2><p>{post.description}</p><div className={styles.tags}>{post.tags?.map(value => <span key={value}>{value}</span>)}</div></div>
    </RouterLink>)}</div>
    {filtered.length === 0 ? <p className={styles.empty}>조건에 맞는 글이 없습니다. 검색어나 주제를 바꿔 보세요.</p> : null}
  </div>;
}
