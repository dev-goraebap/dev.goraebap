import { preloadable } from '@/shared/lib/preloadable';

// The body editor and its libraries (Tiptap, KaTeX, lowlight) load when first shown, not with the app (frontend bundle
// policy). A page that shows a body prepares it before it is drawn (RichBody.preload in shared/lib/prepare), so the body is there
// from the first frame and what stands under it does not move.
export const LazyRichBody = preloadable(() => import('./RichBody').then(module => module.RichBody));
export const LazyRichDraft = preloadable(() => import('./RichDraft').then(module => module.RichDraft));
