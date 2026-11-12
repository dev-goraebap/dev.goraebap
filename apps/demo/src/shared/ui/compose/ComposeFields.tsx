/**
 * 만들기 양식의 제목과 본문(호호코워크 ComposeForm): 테두리 없이 종이 위에 쓴다. 제목은 큰 글씨, 본문은 쓰는 만큼 늘어난다.
 * 크기는 놓인 곳(ComposeSurface)이 정한다: 대화상자는 18px 제목과 3.5rem 본문, 페이지는 24px 제목과 12rem 본문.
 */
export function ComposeFields({ title, onTitle, titlePlaceholder, body, onBody, bodyPlaceholder }: {
  title: string
  onTitle: (title: string) => void
  titlePlaceholder: string
  body: string
  onBody: (body: string) => void
  bodyPlaceholder: string
}) {
  return (
    <>
      <input aria-label="제목" placeholder={titlePlaceholder} autoFocus autoComplete="off" value={title} onChange={event => onTitle(event.target.value)}
        className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />
      <textarea aria-label="본문" placeholder={bodyPlaceholder} value={body} onChange={event => onBody(event.target.value)}
        className="field-sizing-content min-h-14 w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground/70 group-data-page/compose:min-h-48" />
    </>
  )
}
