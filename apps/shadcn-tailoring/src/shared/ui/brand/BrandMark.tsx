/**
 * The company's symbol (HO over HO, client/public/branding/hohocowork-mark.svg) drawn in the text's colour, so it follows the
 * theme and mode. Square; size sets its side. An empty label leaves it to what it stands beside (a logo naming it).
 */
export function BrandMark({ size = '1.5rem', label = 'hohocowork' }: { size?: string; label?: string }) {
  return <svg viewBox="0 0 400 400" width={size} height={size} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} fill="currentColor">
    <g transform="scale(.8 1)">
      <path d="M52 4C79 4 99 25 99 52V72Q99 80 107 80H135Q143 80 143 72V52C143 25 163 4 190 4C217 4 237 25 237 52V137C237 164 218 184 191 184C164 184 144 164 144 137V129C144 112 134 102 121 102C108 102 98 112 98 129V137C98 164 78 184 51 184C24 184 5 164 5 137V52C5 25 25 4 52 4Z" />
      <path d="M51 203C78 203 98 223 98 250V257Q98 267 108 268L194 275C219 277 237 295 237 320V351C237 378 217 398 190 398C163 398 143 378 143 351V326Q143 318 135 318H107Q99 318 99 326V351C99 378 79 398 52 398C25 398 5 378 5 351V250C5 223 24 203 51 203Z" />
    </g>
    <path d="M116 204Q121 198 129 203Q177 238 226 203Q237 196 244 205Q248 211 243 220C222 271 141 277 115 221Q110 211 116 204Z" />
    <g fillRule="evenodd">
      <path d="M300 2a98 98 0 1 1 0 196a98 98 0 1 1 0-196M300 61a39 39 0 1 0 0 78a39 39 0 1 0 0-78" />
      <path d="M300 204a98 98 0 1 1 0 196a98 98 0 1 1 0-196M300 263a39 39 0 1 0 0 78a39 39 0 1 0 0-78" />
    </g>
  </svg>;
}
