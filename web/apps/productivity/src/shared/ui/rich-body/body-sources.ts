import type { JSONNode } from '@/shared/lib/rich-document';

/** Swap preview addresses and stable attachment references without changing the editor's draft. */
export function mapBodySources(body: JSONNode, map: ReadonlyMap<string, string>): JSONNode {
  const copy = structuredClone(body);
  const visit = (node: JSONNode) => {
    if (typeof node.attrs?.src === 'string') node.attrs.src = map.get(node.attrs.src) ?? node.attrs.src;
    node.content?.forEach(visit);
  };
  visit(copy);
  return copy;
}

/** Bind only newly uploaded media still present in the final body, including nested blocks. */
export function prepareBodyFiles(shown: JSONNode, sources: ReadonlyMap<string, string>, attached: Readonly<Record<string, string>> = {}) {
  const body = mapBodySources(shown, sources);
  const referenced = new Set<string>();
  const visit = (node: JSONNode) => {
    if (typeof node.attrs?.src === 'string') referenced.add(node.attrs.src);
    node.content?.forEach(visit);
  };
  visit(body);
  const uploadIds = [...new Set(sources.values())].filter(ref => referenced.has(ref)).map(ref => ref.slice('attachment:'.length)).filter(id => !attached[id]);
  return { body, uploadIds };
}
