import { createContext, useContext, useState } from 'react';

/**
 * An editor page's one editing (업무 · 문서의 수정 화면): the title and the body are written together, and 저장 · Ctrl+S ·
 * 완료 keep both (명시 저장). The page holds it (useBodyEdit with isEditor) round its title (BodyTitle) and its body
 * (RichBody), which saves the title with the body. A detail only reads: its 편집 opens the editor page.
 */
export type BodyEdit = {
  isEditing: boolean;
  setEditing: (isEditing: boolean) => void;
  title: string;
  draft: string;
  setDraft: (draft: string) => void;
  /** The title written differs from the one kept. */
  isTitleChanged: boolean;
  /** Keeps the title written, when it differs and is not empty. */
  saveTitle: (overLatest?: boolean) => Promise<void>;
  placeholder: string;
};

export const BodyEditContext = createContext<BodyEdit | null>(null);
export const useBodyEditContext = () => useContext(BodyEditContext);

/**
 * The editing a detail holds: its title kept, onSaveTitle keeping a changed one (at most max letters, 200 by default).
 * subject names what is edited when one page shows one thing after another (문서함's documents): another one ends the
 * editing.
 */
export function useBodyEdit({ title, placeholder, onSaveTitle, subject, version, max = 200, isEditor = false, onLeave }: {
  title: string; placeholder: string; onSaveTitle: (title: string, expectedVersion?: number) => unknown; subject?: string; version?: number; max?: number;
  /** 수정 화면: 처음부터 편집 중이고, 편집을 끝내면(완료 · 취소) onLeave로 나간다. */
  isEditor?: boolean; onLeave?: () => void;
}): BodyEdit {
  const [isEditing, setIsEditing] = useState(isEditor);
  const [draft, setDraftText] = useState(title);
  const [base, setBase] = useState({ title, version });
  const [editedSubject, setEditedSubject] = useState(subject);
  if (subject !== editedSubject) {
    setEditedSubject(subject);
    setIsEditing(isEditor);
    setDraftText(title);
    setBase({ title, version });
  }
  const next = draft.trim();
  const isTitleChanged = isEditing && next !== base.title;
  return {
    isEditing, title, draft, placeholder, isTitleChanged,
    setEditing: value => {
      if (!value && isEditor) { onLeave?.(); return; }
      if (value && !isEditing) { setDraftText(title); setBase({ title, version }); }
      setIsEditing(value);
    },
    setDraft: value => setDraftText(value.slice(0, max)),
    saveTitle: async (overLatest = false) => {
      if (!isTitleChanged) return;
      if (!next) throw new Error('제목을 입력해 주세요.');
      const expected = overLatest ? version : base.version;
      await onSaveTitle(next, expected);
      setBase({ title: next, version: expected === undefined ? undefined : expected + 1 });
    },
  };
}

/**
 * The detail's title: its heading while read, written in place while the detail is edited, as a new thing's title is
 * (ComposeForm): the same large letters, no box round them.
 */
/** 상세의 제목과 수정 화면의 제목 칸은 같은 것이라, 두 화면을 오갈 때 제자리에서 이어지게 한다(화면 전환의 한 조각). */
const HEADING = 'text-2xl font-semibold [view-transition-name:cowork-body-title]';

export function BodyTitle({ title }: { title: string }) {
  const edit = useBodyEditContext();
  if (!edit?.isEditing) return <h1 className={HEADING}>{title}</h1>;
  return <h1 className={HEADING}>
    <input className="box-border w-full border-0 bg-transparent p-0 [font:inherit] tracking-[inherit] text-inherit outline-0 placeholder:text-muted-foreground/70"
      value={edit.draft} placeholder={edit.placeholder} aria-label="제목" onChange={event => edit.setDraft(event.target.value)} />
  </h1>;
}
