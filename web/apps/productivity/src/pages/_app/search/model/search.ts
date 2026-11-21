import { useEffect, useState, type ReactNode } from 'react';
import type { Icon } from '@/shared/ui/kit/icon';

/**
 * A place a search finds: what it is, where it stands, its mark (an icon; a person or a project may bring a picture of
 * its own as media), and its address.
 */
export type SearchHit = { id: string; label: string; where: string; icon: Icon; media?: ReactNode; href: string };

/**
 * Where a search looks, one group of hits each (메뉴, and 업무 · 문서 · … as the server finds them). find
 * answers the words asked for; it may take its time (a server's), the search waiting on it with the words it was asked.
 */
export type SearchSource = { id: string; title: string; find: (words: string) => SearchHit[] | Promise<SearchHit[]> };

/** The words a search asks with: what was typed once typing pauses (wait), as a search should not run at every key. */
export function useSettled(value: string, wait = 200) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), value.trim() ? wait : 0);
    return () => window.clearTimeout(timer);
  }, [value, wait]);
  return settled;
}

/** Whether a name holds the words, each of them, in any case and spacing (업무 보고 finds 주간보고 · 업무 alike). */
export function matches(text: string, words: string) {
  const plain = text.toLowerCase().replace(/\s+/g, '');
  return words.toLowerCase().split(/\s+/).filter(Boolean).every(word => plain.includes(word));
}

/** Each source's hits for the words, in the sources' order, read again whenever the words settle; pending while any are out. */
export function useSearch(sources: readonly SearchSource[], words: string) {
  const [found, setFound] = useState<{ words: string; groups: { source: SearchSource; hits: SearchHit[] }[] }>({ words: '', groups: [] });
  useEffect(() => {
    let isCurrent = true;
    if (!words.trim()) { setFound({ words, groups: [] }); return undefined; }
    void Promise.all(sources.map(async source => ({ source, hits: await Promise.resolve(source.find(words)).catch(() => []) })))
      .then(groups => { if (isCurrent) setFound({ words, groups: groups.filter(group => group.hits.length > 0) }); });
    return () => { isCurrent = false; };
  }, [sources, words]);
  return { ...found, isPending: found.words !== words };
}

const RECENT_KEY = 'cowork-recent-searches';
const RECENT_MAX = 6;

/** This browser's last searches that led somewhere, newest first: offered again before anything is typed. */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() => {
    try { return (JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]') as unknown[]).filter((each): each is string => typeof each === 'string'); }
    catch { return []; }
  });
  const keep = (next: string[]) => {
    setRecent(next);
    try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* this visit keeps them */ }
  };
  return {
    recent,
    add: (words: string) => { const trimmed = words.trim(); if (trimmed) keep([trimmed, ...recent.filter(each => each !== trimmed)].slice(0, RECENT_MAX)); },
    remove: (words: string) => keep(recent.filter(each => each !== words)),
    clear: () => keep([]),
  };
}
