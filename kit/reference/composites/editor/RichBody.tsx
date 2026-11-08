import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import styles from './editor.module.css';

/** 작성할 때의 스키마 그대로 읽습니다. 속성만 바뀌면 본문과 선택 영역을 다시 만들지 않습니다. */
export function RichBody({ value }: { value: JSONContent }) {
  const editor = useEditor({
    extensions: [StarterKit], content: value, editable: false, immediatelyRender: false,
    editorProps: { attributes: { class: `${styles.prose} ${styles.reading}`, role: 'article', 'aria-label': '본문' } },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  return <EditorContent editor={editor} />;
}
