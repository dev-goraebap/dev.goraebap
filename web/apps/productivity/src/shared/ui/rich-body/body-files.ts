import { sendJson, type components } from '@/shared/api';
import { measureImage, type ImageTraits } from '@/shared/lib/image-traits';

type Purpose = NonNullable<components['schemas']['Upload']['purpose']>;

/** Upload bytes now; the owning body binds the ticket only when it is saved. */
export async function uploadBodyFile(file: File, signal?: AbortSignal, purpose: Purpose = 'EVIDENCE') {
  return (await uploadBodyFileWithTraits(file, signal, purpose)).id;
}

/**
 * The same upload, also giving back what was measured of a picture (its main colour and size). The server keeps them
 * with the file, and an editor puts them on the picture's block, so a screen paints its place before it loads.
 */
export async function uploadBodyFileWithTraits(file: File, signal?: AbortSignal, purpose: Purpose = 'EVIDENCE'): Promise<{ id: string; traits: ImageTraits }> {
  if (signal?.aborted) throw new DOMException('취소했습니다.', 'AbortError');
  const traits = await measureImage(file);
  const ticket = await sendJson<components['schemas']['UploadTicket']>('/api/v1/files/uploads', 'POST', { filename: file.name, size: file.size, purpose, ...traits });
  if (!ticket.id || !ticket.url) throw new Error('파일을 올리지 못했습니다.');
  const response = await fetch(new URL(ticket.url, window.location.origin), { method: ticket.method ?? 'PUT', headers: ticket.headers, body: file, signal });
  if (!response.ok) throw new Error('파일을 올리지 못했습니다.');
  if (signal?.aborted) throw new DOMException('취소했습니다.', 'AbortError');
  return { id: ticket.id, traits };
}

