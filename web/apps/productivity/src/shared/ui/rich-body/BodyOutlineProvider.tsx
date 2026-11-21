import { useState, type ReactNode } from 'react';
import { OutlineContext, type BodyHeading } from './outline-context';

export function BodyOutlineProvider({ children }: { children: ReactNode }) {
  const [headings, setHeadings] = useState<BodyHeading[]>([]);
  const publish = (next: BodyHeading[]) => setHeadings(current =>
    current.length === next.length && current.every((heading, index) => heading.id === next[index]!.id && heading.text === next[index]!.text) ? current : next);
  const [versions, publishVersions] = useState(0);
  return <OutlineContext value={{ headings, publish, versions, publishVersions }}>{children}</OutlineContext>;
}
