import { docs } from 'virtual:guide-docs';
export const posts = docs.filter(doc => doc.kind === 'post');
export const postTags = [...new Set(posts.flatMap(post => post.tags ?? []))].sort();
export { readPostSearch, postSearchHref } from './search';
