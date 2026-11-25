import { useDesignConfig } from "@/shared/lib/design-config";
import { UiSizeControl } from "@/shared/ui";

const SCALE_METHODS = [
  {
    name: "브라우저 확대",
    grows: "글자·컨트롤·테두리·이미지 전부",
    layout: "CSS 뷰포트가 좁아져 모바일 배치로 바뀔 수 있음",
    scope: "브라우저가 사이트별로 기억",
  },
  {
    name: "브라우저 글꼴 크기",
    grows: "rem과 퍼센트로 지정한 값",
    layout: "rem 미디어 쿼리의 전환 지점도 함께 이동",
    scope: "모든 사이트",
  },
  {
    name: "사이트의 화면 크기",
    grows: "rem으로 지정한 값",
    layout: "미디어 쿼리 전환 지점 유지",
    scope: "이 사이트만",
  },
];

const UNIT_GUIDE = [
  { target: "글자 크기", unit: "rem", reason: "읽는 사람의 크기 설정을 그대로 따라야 합니다." },
  {
    target: "컨트롤 높이와 아이콘",
    unit: "rem",
    reason: "글자와 함께 커져야 라벨이 잘리지 않고 누르기 편합니다.",
  },
  {
    target: "여백과 간격",
    unit: "rem",
    reason: "글자가 커질 때 주변 여백도 같은 비례로 유지합니다.",
  },
  {
    target: "콘텐츠 최대 폭",
    unit: "rem",
    reason: "글자 크기가 바뀌어도 한 줄의 글자 수를 읽기 좋은 길이로 지킵니다.",
  },
  {
    target: "미디어 쿼리",
    unit: "rem",
    reason: "브라우저 글꼴 크기 설정에 맞춰 전체 배치 전환 시점이 함께 움직입니다.",
  },
  {
    target: "테두리와 구분선",
    unit: "px",
    reason: "두꺼워져도 읽거나 누르는 데 도움이 되지 않습니다.",
  },
  {
    target: "그림자와 블러",
    unit: "px",
    reason: "시각적 깊이 표현이라 글자 크기를 따라 키울 이유가 없습니다.",
  },
  { target: "스크롤바와 배경 패턴", unit: "px", reason: "콘텐츠가 아니라 화면의 보조 틀입니다." },
];

const cell = "border-border border-b px-3 py-2 align-top";

export function ScaleMethodTable() {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[34rem] text-left text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className={`${cell} font-medium`}>방식</th>
            <th className={`${cell} font-medium`}>커지는 것</th>
            <th className={`${cell} font-medium`}>레이아웃</th>
            <th className={`${cell} font-medium`}>적용 범위</th>
          </tr>
        </thead>
        <tbody>
          {SCALE_METHODS.map((method) => (
            <tr key={method.name} className="last:[&>*]:border-b-0">
              <th className={`${cell} font-medium`}>{method.name}</th>
              <td className={cell}>{method.grows}</td>
              <td className={cell}>{method.layout}</td>
              <td className={cell}>{method.scope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UnitGuideTable() {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[30rem] text-left text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className={`${cell} font-medium`}>대상</th>
            <th className={`${cell} font-medium`}>단위</th>
            <th className={`${cell} font-medium`}>이유</th>
          </tr>
        </thead>
        <tbody>
          {UNIT_GUIDE.map((row) => (
            <tr key={row.target} className="last:[&>*]:border-b-0">
              <th className={`${cell} font-medium`}>{row.target}</th>
              <td className={`${cell} font-mono`}>{row.unit}</td>
              <td className={cell}>{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UiSizeCompareDemo() {
  const { rootScale } = useDesignConfig();
  const remText = Math.round(14 * rootScale * 10) / 10;

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-sm">
        <UiSizeControl />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="min-w-0 space-y-2">
          <figcaption className="text-muted-foreground font-mono text-[0.6875rem]">
            rem · 글자 {remText}px
          </figcaption>
          <div className="border-border bg-card space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">프로젝트 이름</p>
            <div className="border-input flex h-9 items-center rounded-md border px-3 text-sm">
              dev.goraebap
            </div>
            <div className="bg-primary text-primary-foreground flex h-9 items-center justify-center rounded-md text-sm font-medium">
              저장
            </div>
          </div>
        </figure>
        <figure className="min-w-0 space-y-2">
          <figcaption className="text-muted-foreground font-mono text-[0.6875rem]">
            px 고정 · 글자 14px
          </figcaption>
          <div className="border-border bg-card space-y-[12px] rounded-lg border p-[16px]">
            <p className="text-[14px] font-medium">프로젝트 이름</p>
            <div className="border-input flex h-[36px] items-center rounded-md border px-[12px] text-[14px]">
              dev.goraebap
            </div>
            <div className="bg-primary text-primary-foreground flex h-[36px] items-center justify-center rounded-md text-[14px] font-medium">
              저장
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}
