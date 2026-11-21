import { useEffect, useRef } from 'react';
import type { JSONNode, UploadFile } from '@/shared/lib/rich-document';
import { uploadBodyFileWithTraits } from './body-files';
import { prepareBodyFiles } from './body-sources';

/** Files of an unsaved owner: local previews while composing, stable references when saving. */
export type DraftFilesSnapshot = readonly (readonly [string, string])[];

export function useDraftFiles(initial?: DraftFilesSnapshot) {
  const sources = useRef(new Map<string, string>(initial));
  const transferred = useRef(false);
  const reset = () => { for (const url of sources.current.keys()) URL.revokeObjectURL(url); sources.current.clear(); };
  useEffect(() => () => { if (!transferred.current) reset(); }, []);
  const handoff = (): DraftFilesSnapshot => { transferred.current = true; return [...sources.current]; };
  const upload: UploadFile = async (file, progress, signal) => {
    const { id, traits } = await uploadBodyFileWithTraits(file, signal);
    const url = URL.createObjectURL(file);
    sources.current.set(url, `attachment:${id}`);
    progress?.(100);
    return { url, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, ...traits };
  };
  const prepare = (shown: JSONNode, attached?: Readonly<Record<string, string>>) => {
    return prepareBodyFiles(shown, sources.current, attached);
  };
  return { upload, prepare, reset, handoff };
}
