import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './editor.module.css';

/**
 * 작성 양식의 본문 칸 예시(Tiptap StarterKit). 테두리와 서식 도구 막대 없이 종이 위에 쓰며, 서식은 에디터 자체의
 * 단축키·마크다운 입력 규칙으로 한다. 프로젝트는 채택한 에디터로 이 자리를 바꾼다. 비어 있을 때 첫 줄에 안내를 둔다.
 */
export function RichDraft({ value, onChange, placeholder = '내용을 입력하세요', label = '본문', isPage = false }: {
  value?: JSONContent; onChange: (value: JSONContent) => void; placeholder?: string; label?: string; isPage?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit], content: value, immediatelyRender: false,
    editorProps: { attributes: { class: styles.prose, role: 'textbox', 'aria-label': label, 'aria-multiline': 'true',
      'data-placeholder': placeholder, ...(isPage ? { 'data-page': '' } : {}) } },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });
  return <EditorContent editor={editor} />;
}
