import { measureImage } from '@/shared/lib/image-traits';
import { sendCommand, sendJson, type components } from '@/shared/api';

export async function uploadPicture(picture: Blob) {
  if (picture.size > 1024 * 1024) throw new Error('사진은 1MB 이하로 올려 주세요.');
  const ticket = await sendJson<components['schemas']['UploadTicket']>('/api/v1/files/uploads', 'POST',
    { filename: 'profile.jpg', size: picture.size, purpose: 'AVATAR', width: 512, height: 512, dominantColor: (await measureImage(picture)).dominantColor });
  if (!ticket.url || !ticket.id) throw new Error('사진 업로드를 준비하지 못했습니다.');
  const sent = await fetch(new URL(ticket.url, location.origin), { method: ticket.method ?? 'PUT', headers: ticket.headers as Record<string, string>, body: picture });
  if (!sent.ok) throw new Error('사진을 올리지 못했습니다. 다시 시도해 주세요.');
  await sendCommand('/api/v1/me/avatar', 'PUT', { uploadId: ticket.id });
}

export const savePreset = (preset?: number) => sendCommand('/api/v1/me/avatar', 'PUT', preset == null ? {} : { preset });
