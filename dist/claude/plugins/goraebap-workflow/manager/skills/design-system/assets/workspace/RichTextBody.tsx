import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

/** 프로젝트 에디터를 연결할 본문 슬롯의 Tiptap 예제다. 서식 도구는 에디터가 제공한다. */
export function RichTextBody({ value, onChange }: { value?: JSONContent; onChange: (value: JSONContent) => void }) {
  const editor = useEditor({
    extensions: [StarterKit], content: value, immediatelyRender: false,
    editorProps: { attributes: { class: 'reference-creation-body', role: 'textbox', 'aria-label': '본문', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });
  return <EditorContent editor={editor} />;
}
