import { queryOptions, useQuery } from '@tanstack/react-query';
import { getJson, type components } from '@/shared/api';
import { derivedAvatar, drawnAvatarSource } from './model/drawn-avatars';

type ChosenAvatar = components['schemas']['AvatarItem'];
export const avatarKeys = ['directory', 'avatars'] as const;
export const avatarsOptions = () => queryOptions({
  queryKey: avatarKeys,
  queryFn: ({ signal }) => getJson<ChosenAvatar[]>('/api/v1/directory/avatars', signal),
  staleTime: 5 * 60_000,
});

export function avatarSource(id: string, chosen?: ChosenAvatar[]) {
  const avatar = chosen?.find(item => item.employeeId === id);
  if (avatar?.pictureId) return `/api/v1/directory/avatars/${encodeURIComponent(id)}/${avatar.pictureId}`;
  return drawnAvatarSource(avatar?.preset ?? derivedAvatar(id));
}

/** All people share one cached directory query, so a changed picture appears throughout the app. */
export function useMemberPicture(id?: string) {
  const avatars = useQuery({ ...avatarsOptions(), enabled: !!id });
  return avatarSource(id ?? '', avatars.data);
}

/** Current avatar state for editing: resolved image source plus whether a custom photo or preset is saved. */
export function useMemberAvatar(id: string) {
  const avatars = useQuery({ ...avatarsOptions(), enabled: !!id });
  const avatar = avatars.data?.find(item => item.employeeId === id);
  const hasPhoto = Boolean(avatar?.pictureId);
  const savedPreset = hasPhoto ? undefined : avatar?.preset;
  return {
    picture: avatarSource(id, avatars.data),
    hasPhoto,
    savedPreset,
    isDefault: !hasPhoto && savedPreset == null,
  };
}
