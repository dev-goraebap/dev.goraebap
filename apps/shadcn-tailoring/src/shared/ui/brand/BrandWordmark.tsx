// HOHOCO의 원래 윤곽을 유지한다. WORK의 O도 같은 윤곽을 사용한다.
const h = 'M29 7Q42 3 62 4Q91 4 100 13Q108 21 108 47L107 112Q107 122 118 123L172 122Q182 121 182 110L182 43Q182 19 192 11Q202 3 232 4Q260 4 268 14Q276 24 276 51L275 269Q275 298 265 307Q255 316 230 316Q200 316 191 307Q182 298 182 276L182 211Q182 198 170 197L120 198Q108 198 108 211L109 277Q109 300 98 309Q87 317 60 316Q32 316 21 308Q10 300 10 274L10 49Q10 20 19 13Q23 9 29 7Z';
const o = 'M147 3Q215 2 250 34Q290 71 292 156Q294 242 253 282Q216 318 147 318Q78 318 40 283Q1 247 1 161Q0 81 37 40Q74 2 147 3Z M104 130Q93 139 93 160Q93 181 105 191Q117 200 147 200Q177 200 189 190Q201 180 200 158Q199 138 188 130Q177 121 146 121Q116 121 104 130Z';

export function BrandWordmark({ width = '15rem' }: { width?: string }) {
  return <svg className="block h-auto max-w-full" width={width} viewBox="0 0 3026 324" role="img" aria-label="hohocowork" fill="currentColor">
    <path transform="translate(0 2)" d={h} />
    <path transform="translate(287 2)" fillRule="evenodd" d={o} />
    <path transform="translate(591 2)" d={h} />
    <path transform="translate(878 2)" fillRule="evenodd" d={o} />
    <path transform="translate(1182 2)" d="M244 96C210 36 62 42 56 160C62 278 210 284 244 224"
      fill="none" stroke="currentColor" strokeWidth="96" strokeLinecap="round" strokeLinejoin="round" />
    <path transform="translate(1479 2)" fillRule="evenodd" d={o} />
    <path transform="translate(1784 2)"
      d="M49 4Q86 4 92 34L119 164L132 119Q140 91 170 91Q200 91 208 119L222 164L247 34Q253 4 292 4Q344 4 334 54L285 275Q276 316 236 316Q201 316 191 283L170 222L149 283Q138 316 103 316Q63 316 54 275L5 54Q-5 4 49 4Z" />
    <path transform="translate(2134 2)" fillRule="evenodd" d={o} />
    <path transform="translate(2438 2)" fillRule="evenodd"
      d="M11 50Q11 4 61 4H143Q265 4 265 110Q265 175 217 202L266 255Q297 288 264 310Q229 331 203 301L130 221H108V274Q108 316 59 316Q11 316 11 274Z M108 91V142H144Q174 142 174 116Q174 91 144 91Z" />
    <path transform="translate(2735 2)" d="M58 52V268M216 52L109 160L224 268"
      fill="none" stroke="currentColor" strokeWidth="96" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
