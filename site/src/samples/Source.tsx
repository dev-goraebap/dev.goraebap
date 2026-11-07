import { useState } from 'react';

/** 구현 코드를 접어서 보인다. 펼칠 때만 하이라이터(Shiki)를 불러와 본문 코드 덩어리와 같은 두 테마로 칠한다. */
export function Source({ name, code, lang = 'tsx' }: { name: string; code: string; lang?: 'ts' | 'tsx' | 'css' }) {
  const [html, setHtml] = useState<string>();
  const open = async () => {
    if (html) return;
    const { codeToHtml } = await import('shiki');
    setHtml(await codeToHtml(code, { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }));
  };
  return <details onToggle={event => { if ((event.currentTarget as HTMLDetailsElement).open) void open(); }}>
    <summary>{name}</summary>
    {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <pre><code>{code}</code></pre>}
  </details>;
}
