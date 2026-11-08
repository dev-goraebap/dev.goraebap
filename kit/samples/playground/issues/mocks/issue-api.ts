import type { Issue, IssueApi, IssuePatch, NewIssue } from '../entities/issue';
import { me } from '../entities/issue';
import { seedIssues } from './seed';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createIssueApi({ delay = 180, fail = false, initial = seedIssues }: { delay?: number; fail?: boolean; initial?: Issue[] } = {}): IssueApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('이슈를 불러오지 못했습니다.');
  };
  const missing = () => Object.assign(new Error('이슈를 찾을 수 없습니다.'), { status: 404 });
  const change = (id: string, patch: Partial<Issue>) => {
    const current = items.find(each => each.id === id);
    if (!current) throw missing();
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    items = items.map(each => (each.id === id ? next : each));
    return structuredClone(next);
  };
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async get(id, signal) {
      await wait(signal);
      const item = items.find(each => each.id === id);
      if (!item) throw missing();
      return structuredClone(item);
    },
    async create(input: NewIssue) {
      await wait();
      const number = Math.max(0, ...items.map(each => Number(each.id.slice(4)))) + 1;
      const now = new Date().toISOString();
      const issue: Issue = { ...input, id: `ISS-${number}`, author: me, createdAt: now, updatedAt: now, comments: [] };
      items = [issue, ...items];
      return structuredClone(issue);
    },
    async update(id, patch: IssuePatch) {
      await wait();const current=items.find(each=>each.id===id);if(!current)throw missing();
      if(patch.parent){let parent:string|undefined=patch.parent;const seen=new Set<string>([id]);while(parent){if(seen.has(parent))throw new Error('하위 이슈를 상위로 정할 수 없습니다.');seen.add(parent);parent=items.find(each=>each.id===parent)?.parent}}
      const names:Record<string,string>={status:'상태',priority:'우선순위',assignee:'담당자',due:'마감일',start:'시작일',labels:'라벨',parent:'상위 이슈',type:'유형',title:'제목',body:'본문'};
      const keys=Object.keys(patch).filter(key=>JSON.stringify(current[key as keyof Issue])!==JSON.stringify(patch[key as keyof IssuePatch]));
      return change(id,{...patch,events:[...(current.events??[]),...keys.map(key=>({id:crypto.randomUUID(),at:new Date().toISOString(),actor:me,text:`${names[key]??key}을(를) 변경했습니다.`}))]});
    },
    async remove(id){await wait();if(!items.some(each=>each.id===id))throw missing();items=items.filter(each=>each.id!==id).map(each=>each.parent===id?{...each,parent:undefined}:each);},
    async comment(id, text, parentId) {
      await wait();
      const current = items.find(each => each.id === id);
      if (!current) throw missing();
      return change(id, { comments: [...current.comments, { id: crypto.randomUUID(), author: me, text, parentId, at: new Date().toISOString() }] });
    },
    async editComment(id, commentId, text) {
      await wait();
      const current = items.find(each => each.id === id);
      if (!current) throw missing();
      const comment = current.comments.find(each => each.id === commentId);
      if (!comment || comment.author !== me) throw new Error('이 댓글을 바꿀 수 없습니다.');
      return change(id, { comments: text === undefined ? current.comments.filter(each => each.id !== commentId)
        : current.comments.map(each => each.id === commentId ? {...each, text, editedAt: new Date().toISOString()} : each) });
    },
  };
}
