import { Avatar as AstryxAvatar } from '@astryxdesign/core/Avatar';
import type { ComponentProps } from 'react';
import { derivedAvatar, drawnAvatarSource } from './drawn-avatars';
export function PersonAvatar(props: ComponentProps<typeof AstryxAvatar>) {
  return <AstryxAvatar {...props} size={props.size === 'xsm' ? 16 : props.size} tooltip={props.tooltip ?? false} src={props.src ?? drawnAvatarSource(derivedAvatar(props.name ?? 'guest'))} />;
}
