/**
 * 본문 칸이 호스트에게 받는 것. 키트에는 서버가 없으므로 올리기·링크 미리보기는 호스트의 비동기 함수가 맡는다.
 */

/** 올린 파일. 사진이면 올릴 때 잰 대표색(#rrggbb)과 원본 가로·세로를 함께 주면 다시 열 때 자리를 먼저 그 색·비율로 잡는다. */
export type UploadedFile = { url: string; name: string; mime: string; size?: number; dominantColor?: string; width?: number; height?: number };
/** 파일 하나를 올린다. 진행률(0~100)을 알리고, 취소 신호를 받는다. url은 앱 안의 주소, HTTPS, 또는 호스트가 수명을 맡는 blob URL이다. */
export type UploadFile = (file: File, progress?: (percent: number) => void, signal?: AbortSignal) => Promise<UploadedFile>;

/** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 것(같은 공간의 문서): 이름, 앱 안의 주소(/…), 덧붙이는 설명. */
export type LinkChoice = { title: string; href: string; hint?: string };

/** 링크 카드가 보일 그 페이지의 제목·설명·대표 사진. 읽지 못한 값은 비운다. */
export type LinkPreview = { url: string; site?: string; title?: string; description?: string; image?: string };
/** 웹 주소의 미리보기를 읽는다. 서버가 읽어야 한다(브라우저가 남의 사이트에 직접 묻지 않는다). 실패하면 주소만 있는 카드가 된다. */
export type ReadLinkPreview = (url: string) => Promise<LinkPreview>;
