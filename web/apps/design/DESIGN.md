# @goraebap/design — Design Decisions

## 1. Product Brief & Intent

- **Goal**: Framework-agnostic 5-layer Design System portal (`@goraebap/design-system`) showcasing how **Pure HTML (Tokens + Recipes)**, **React (`@base-ui/react`)**, and **Angular (`@spartan-ng/brain`)** share identical visual tokens and CVA recipes across Desktop and Mobile (`< 64rem`, 390px).
- **Reference**: Inspired by Astryx (`https://astryx.atmeta.com/`) — dark-default high-contrast canvas, sticky top bar, interactive theme hero, 3-column docs shell, and 2-column component browser with live miniature preview tiles.
- **Non-goals**: Not a blog (editorial writing lives in `web/apps/blog`).

## 2. Information Architecture & Region Ownership

- **Global Top Bar** (`h-14`, sticky, `max-w-7xl`):
  - Left: Brand mark (`goraebap/design`) → `/`
  - Center: Primary destinations (`Docs`, `Components`, `Templates`, `Themes`) with pill active state
  - Right: Light/Dark mode toggle + `Get started` pill CTA (`/docs`)
- **Landing (`/`)**:
  - First viewport: Value proposition + dual pill CTAs (`Get started`, `Browse components`) + live interactive theme & adapter card (`App` / `Editorial` switchable immediately in hero).
  - Below fold: Bento grid (4 core capabilities), 5-layer architecture map, closing CTA band.
- **Docs (`/docs/*`)**: 3-column shell — Left sticky group nav (`w-56`) | Center prose (`min-w-0 flex-1`) | Right sticky `On this page` anchor rail (`w-48`, `xl:block`).
- **Components (`/components`, `/components/$slug`)**: 2-column shell — Left sticky search input + categorized list (`w-60`) | Main content (`Browse the library` 3-column live tile grid on index; `AdapterPreviewStage` on detail).
- **Templates (`/templates`)**: Pattern showcase (`AppShell`, Responsive `Dialog ↔ Bottom Sheet`, Account/Settings cards) with Desktop/Mobile 390px switching.
- **Themes (`/themes`)**: Side-by-side `App` vs `Editorial` surface hierarchy (`--sidebar` < `--background` < `--card` < `--popover`) and semantic token inspector.

## 3. Visual & Token Specification

- Uses `@goraebap/design-system/styles` (`base.css` + `theme-app.css` + `theme-editorial.css`).
- **Default mode**: Dark (`html.dark`) matching Astryx's low-glare studio canvas, with instant Light/Dark toggle persisted to `localStorage("goraebap-design-mode")`.
- **Theme scoping**: Preview stages apply `data-theme="app"` or `data-theme="editorial"` locally so visitors compare themes without jarring full-page flashes, while Hero/Themes can preview live switches.
- **Shape & Weight**: Pill CTAs (`rounded-full`) for primary site navigation/marketing actions; crisp `rounded-xl` / `rounded-2xl` bento & preview tiles with 1px hairline `--border`.

## 4. Interaction Contracts

- **Adapter Switching (`Pure HTML` | `React` | `Angular`)**:
  - `Pure HTML`: Renders real native HTML elements (`<button>`, `<input>`, `<dialog>`, `<details>`, `<input type="checkbox" role="switch">`, `<table>`) styled solely with `@goraebap/design-system` CVA recipe classes — proving visual parity without any UI framework.
  - `React`: Renders live `@goraebap/ui` (`@base-ui/react`) interactive components.
  - `Angular`: Shows `@spartan-ng/brain` template + identical CVA recipe usage (prepared for live Angular iframe embed once `apps/accounts` migrates).
- **Viewport Switching (`Desktop` | `Mobile 390px`)**: Constrains stage width to `390px` and passes `isMobile: true` so responsive components (`Dialog` → `Bottom Sheet`, full-width mobile buttons) demonstrate actual behavioral adaptation.
- **Component Search**: Typing in the `/components` sidebar filters the component list immediately without losing focus.

## 5. Verification Plan

1. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm knip`, `pnpm typecheck` across the monorepo.
2. Live browser verification on `http://localhost:5175`:
   - Landing hero theme switch + CTA navigation.
   - `/components` search filter + live preview tile grid → click into `/components/dialog`.
   - `/components/dialog`: switch `Pure HTML` (open native `<dialog>`) vs `React` (open `Dialog` in Desktop and `Bottom Sheet` in Mobile 390px) + switch `Code` tab.
   - `/docs` 3-column shell navigation + `/templates` + `/themes`.
   - Light/Dark mode toggle contrast & layout check.
