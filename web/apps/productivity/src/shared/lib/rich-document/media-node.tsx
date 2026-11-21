import {ReactNodeViewRenderer} from '@tiptap/react';
import {Media} from './schema';
export const clampWidth=(value:unknown)=>Math.min(100,Math.max(25,Number(value)||100));
;
export function bytes(size:number){return size>1024*1024?`${(size/1024/1024).toFixed(1)} MB`:size>1024?`${Math.round(size/1024)} KB`:size?`${size} B`:'';}
;
import {MediaView} from './MediaView';
export const MediaNodeView=Media.extend({addNodeView(){return ReactNodeViewRenderer(MediaView);}});
