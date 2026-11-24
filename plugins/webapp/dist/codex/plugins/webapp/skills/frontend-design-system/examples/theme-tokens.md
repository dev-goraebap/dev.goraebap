---
arc42: "8.5, 2"
---

# 테마 토큰을 CSS 변수로 정의하고 유틸리티로 노출

토큰은 테마 파일 하나에 라이트와 다크로 정의하고, 스타일 도구가 그 토큰을 유틸리티로 쓰게 노출합니다. 규칙은 [테마와 색상](../references/theme.md)에 있습니다.

## react

출처: [web/src/app/theme/tailwind.css](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/theme/tailwind.css)

```css
/*
 * 라이트 · 다크는 html[data-theme]가 정한다(app/providers/AppTheme, public/boot.js). 선택자를 html(:root)로 둔다: 안쪽 요소가
 * data-theme를 달아도 다크 블록을 다시 선언해 색 테마(html에 덮어쓴 기준 색)를 가리지 않게 한다.
 */
@custom-variant dark (&:where(:root[data-theme=dark], :root[data-theme=dark] *));
/* … */
@theme inline {
    /* … */
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    /* … */
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    /* … */
}
:root {
    --background: #f9f9fa;
    --foreground: #1b1b1b;
    /* … */
    --primary: var(--foreground);
    --primary-foreground: #ffffff;
    --secondary: color-mix(in srgb, var(--foreground) 10%, var(--background));
    /* … */
    --border: color-mix(in srgb, var(--foreground) 9%, var(--background));
    --input: color-mix(in srgb, var(--foreground) 18%, var(--background));
    --ring: color-mix(in srgb, var(--foreground) 72%, var(--background));
    /* … */
}
:root[data-theme=dark] {
    --background: #121213;
    --foreground: #f7f8f8;
    /* … */
    --border: color-mix(in srgb, var(--foreground) 8%, var(--background));
    --input: color-mix(in srgb, var(--foreground) 16%, var(--background));
    /* … */
}
@theme {
    --breakpoint-md: 64rem;
    /* … */
    --color-control: color-mix(in srgb, var(--foreground) 5%, var(--background));
    --color-control-hover: color-mix(in srgb, var(--foreground) 9%, var(--background));
    --color-control-on: color-mix(in srgb, var(--foreground) 14%, var(--background));
    --color-control-border: color-mix(in srgb, var(--foreground) 11%, var(--background));
    /* … */
}
@media (width < 64rem) {
    :root { --text-xs: 0.8125rem; --text-sm: 0.9375rem; --text-base: 1.0625rem; }
}
```

라이트 값은 `:root`, 다크 값은 `:root[data-theme=dark]`에 두고, Tailwind의 `dark:` 변형도 같은 문서 루트 속성을 봅니다. 내부 구분선·바깥 경계·조작 면 같은 파생 토큰은 `color-mix`로 글자색을 면 색에 섞어 만듭니다. `@theme inline`과 `@theme`이 변수를 `border-border`·`bg-control` 같은 유틸리티로 노출하고, 휴대폰 글자 크기는 같은 파일의 `@media (width < 64rem)`에서 바꿉니다.
