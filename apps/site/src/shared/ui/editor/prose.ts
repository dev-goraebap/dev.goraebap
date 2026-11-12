/**
 * 리치 본문(ProseMirror가 그리는 요소)의 모양. 본문 안의 문단 · 제목 · 목록 · 표는 ProseMirror가 만드는 맨 HTML이라 요소마다 클래스를
 * 달 수 없어, 본문 요소 하나에 자손 변형([&_h2]:…)으로 건다. 클래스 목록은 Tailwind가 소스에서 그대로 찾아야 하므로 글자 그대로 둔다
 * (조립하면 찾지 못한다).
 *
 * 긴 글을 쓰고 읽는 칸이라 화면 글자(13px)보다 한 단계 큰 본문(text-base, 데스크톱 15px · 휴대폰 17px)으로 쓴다. 최소 높이(대화상자
 * 3.5rem, 페이지 12rem)만 두고 긴 주소는 줄을 넘긴다. 본문 제목은 2단계부터다(화면의 시스템 제목이 1단계).
 */
const BASE = [
  "relative p-0 text-base/[1.65] wrap-anywhere text-foreground outline-none [--block-gap:1.25rem]",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:mt-0 [&_p]:mb-2",
  "[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:leading-[1.4] [&_h2]:font-semibold",
  "[&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-[1.0625rem] [&_h3]:leading-[1.45] [&_h3]:font-semibold",
  "[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-base [&_h4]:font-semibold",
  // 목록: 기호와 번호를 되살리고(전역 reset이 지운다), 할 일 목록은 체크 칸과 글을 나란히 둔다.
  "[&_:is(ul,ol)]:mt-0 [&_:is(ul,ol)]:mb-2 [&_:is(ul,ol)]:ps-5 [&_ul]:list-disc [&_ol]:list-decimal [&_li>p]:mb-1",
  "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:ps-1 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
  "[&_ul[data-type=taskList]_li>label]:mt-[0.3rem] [&_ul[data-type=taskList]_li>label]:flex-none [&_ul[data-type=taskList]_li>div]:min-w-0 [&_ul[data-type=taskList]_li>div]:flex-1",
  "[&_li[data-checked=true]>div]:text-muted-foreground [&_li[data-checked=true]>div]:line-through [&_input[type=checkbox]]:accent-primary",
  "[&_blockquote]:my-3 [&_blockquote]:border-s-[3px] [&_blockquote]:border-input [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border [&_hr.ProseMirror-selectednode]:border-ring",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-[0.8125rem] [&_pre]:leading-[1.6]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:no-underline [&_pre_code]:[font:inherit]",
  // 글 속 코드: 상자 대신 옅은 밑줄, 고정폭에 본문보다 조금 옅게. 상자는 글줄 사이에서 튀고 인쇄에서 흐려 보였다.
  "[&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em] [&_:not(pre)>code]:text-current/80 [&_:not(pre)>code]:underline [&_:not(pre)>code]:decoration-current/40",
  "[&_:not(pre)>code]:decoration-1 [&_:not(pre)>code]:underline-offset-[0.32em] [&_:not(pre)>code]:[text-decoration-skip-ink:none]",
  "[&_a]:text-inherit [&_a]:underline [&_a]:decoration-current/45 [&_a]:underline-offset-[0.2em]",
  // 앱 안의 문서로 가는 링크(문서 언급): 밑줄 대신 옅은 바탕의 이름표. 읽는 화면에서 누르면 새 탭이 아니라 그 화면으로 간다.
  "[&_a[href^='/']:not([href^='//'])]:rounded-md [&_a[href^='/']:not([href^='//'])]:bg-pressed [&_a[href^='/']:not([href^='//'])]:px-1.5 [&_a[href^='/']:not([href^='//'])]:py-px",
  "[&_a[href^='/']:not([href^='//'])]:font-medium [&_a[href^='/']:not([href^='//'])]:no-underline [&_a[href^='/']:not([href^='//'])]:hover:bg-secondary",
  "[&_mark]:rounded-[2px] [&_mark]:text-inherit [&_:is(sup,sub)]:text-[0.75em]",
  // 문서가 비면 첫 줄에 안내(data-placeholder)를 보인다.
  "[&:is(:has(>p:only-child:empty),:has(>p:only-child>br.ProseMirror-trailingBreak:only-child))]:before:pointer-events-none",
  "[&:is(:has(>p:only-child:empty),:has(>p:only-child>br.ProseMirror-trailingBreak:only-child))]:before:absolute",
  "[&:is(:has(>p:only-child:empty),:has(>p:only-child>br.ProseMirror-trailingBreak:only-child))]:before:text-muted-foreground/70",
  "[&:is(:has(>p:only-child:empty),:has(>p:only-child>br.ProseMirror-trailingBreak:only-child))]:before:content-[attr(data-placeholder)]",
  // 표: 문서 표 모양. 모서리를 둥글리지 않고 바깥 양옆 세로선을 두지 않으며(위 · 아래 줄과 칸 사이 줄만), 머리글 칸은 옅은 바탕.
  // 감싸는 칸은 세로로 넘치지 않게 한다: 열 너비 손잡이가 칸 밖으로 나가면 스크롤 막대가 생겼다 사라지며 행이 흔들렸다.
  "[&_.tableWrapper]:my-6 [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:overflow-y-hidden",
  "[&_table]:w-full [&_table]:min-w-105 [&_table]:table-fixed [&_table]:border-collapse [&_table]:text-[0.8125rem] [&_table]:leading-[1.65]",
  "[&_:is(td,th)]:relative [&_:is(td,th)]:min-w-12 [&_:is(td,th)]:border-e [&_:is(td,th)]:border-b [&_:is(td,th)]:border-e-border [&_:is(td,th)]:border-b-input",
  "[&_:is(td,th)]:px-[0.8125rem] [&_:is(td,th)]:py-2.5 [&_:is(td,th)]:text-start [&_:is(td,th)]:align-top [&_:is(td,th)_p]:m-0 [&_:is(td,th)_p]:min-h-[1.65em]",
  "[&_tr>:is(td,th):last-child]:border-e-0 [&_tr:first-child>:is(td,th)]:border-t [&_tr:first-child>:is(td,th)]:border-t-input [&_th]:bg-pressed [&_th]:font-semibold",
  "[&_.selectedCell]:after:pointer-events-none [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0 [&_.selectedCell]:after:bg-ring/15 [&_.selectedCell]:after:content-['']",
  "[&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:inset-y-0 [&_.column-resize-handle]:end-0 [&_.column-resize-handle]:w-[3px] [&_.column-resize-handle]:bg-ring",
  "[&.resize-cursor]:cursor-col-resize",
  // 이어 놓인 사진은 너비를 줄이면(50% 이하) 한 줄에 나란히 놓인다. 노드 뷰는 바깥 감싸개(.react-renderer)가 실제 블록이라
  // 그 겹을 나란히 놓아야 한다: 배치는 감싸개에 :has()로 걸고, 안의 사진은 그 칸을 채운다.
  "[&_.react-renderer:has(>[data-kind=image]:is([data-width='25'],[data-width='50']))]:box-border [&_.react-renderer:has(>[data-kind=image]:is([data-width='25'],[data-width='50']))]:inline-block",
  "[&_.react-renderer:has(>[data-kind=image]:is([data-width='25'],[data-width='50']))]:p-1.5 [&_.react-renderer:has(>[data-kind=image]:is([data-width='25'],[data-width='50']))]:align-top",
  "[&_.react-renderer:has(>[data-kind=image][data-width='25'])]:w-1/4 [&_.react-renderer:has(>[data-kind=image][data-width='50'])]:w-1/2",
  "[&_.react-renderer>[data-kind=image]:is([data-width='25'],[data-width='50'])]:m-0 [&_.react-renderer>[data-kind=image]:is([data-width='25'],[data-width='50'])]:w-full!",
  "print:[&_:is(pre,figure,tr,table)]:break-inside-avoid",
].join(" ")

/** 본문 요소의 클래스. 최소 높이는 쓰는 동안에만 둔다(cn으로 합치지 않는다: 자손 변형이 많은 긴 목록이라 겹침 정리가 잘못 지울 수 있다). */
export const proseClass = (isEditable: boolean) => isEditable ? `${BASE} min-h-14 data-page:min-h-48` : BASE
