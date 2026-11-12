import type { JSONContent } from '@tiptap/react';
import { RichEditor } from './RichEditor';
import type { LinkChoice, ReadLinkPreview, UploadFile } from './types';

/**
 * 작성 양식·수정 화면의 본문 칸(Tiptap 3). 테두리와 고정 도구 막대 없이 종이 위에 쓰며, 서식은 글을 고르면 뜨는 도구·`/`
 * 명령·블록 손잡이 메뉴·단축키·마크다운 입력 규칙으로 한다. 비어 있을 때 첫 줄에 안내를 둔다. 제목은 화면의 시스템 제목 하나라서
 * 본문의 제목은 2단계부터다. 올리기(upload)와 링크 미리보기(readPreview)는 호스트가 준다.
 */
export function RichDraft({ value, onChange, placeholder = '내용을 입력하세요', label = '본문', isPage = false, upload, readPreview, links }: {
  value?: JSONContent; onChange: (value: JSONContent) => void; placeholder?: string; label?: string; isPage?: boolean;
  upload?: UploadFile; readPreview?: ReadLinkPreview; links?: LinkChoice[];
}) {
  return <RichEditor value={value} onChange={onChange} isEditable placeholder={placeholder} label={label} isPage={isPage} upload={upload} readPreview={readPreview} links={links} />;
}
