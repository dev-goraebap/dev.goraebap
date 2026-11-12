import { useEffect, useState } from 'react';
import { loadGroup, type SampleEntry } from '@samples/catalog/registry';
import { Sample } from './Sample';

/** 견본 묶음 전체를 파일에 쓴 순서대로 띄운다(견본 메뉴의 문서). 견본 이름을 소제목으로 둬 목차에 잡힌다. */
export function SampleGroup({ group }: { group: string }) {
  const [list, setList] = useState<SampleEntry[]>([]);
  useEffect(() => { void loadGroup(group).then(setList); }, [group]);
  return <>{list.map(entry => <section key={entry.id} className="sample-section">
    <h2 id={entry.key}>{entry.name}</h2>
    <Sample id={entry.id} />
  </section>)}</>;
}
