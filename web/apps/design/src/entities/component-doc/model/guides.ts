export interface ComponentGuide {
  usage: string;
  anatomy?: { name: string; role: string }[];
  accessibility: {
    keys: { keys: string; action: string }[];
    notes: string[];
  };
  related: { slug: string; reason: string }[];
}

export const COMPONENT_GUIDES: Partial<Record<string, ComponentGuide>> = {
  button: {
    usage:
      "저장, 제출, 삭제처럼 누르는 즉시 실행되는 동작에 씁니다. 한 화면에는 [[primary|Primary]] 액션을 하나만 두어 [[visual-hierarchy|시각적 위계]]를 세우고, 나머지는 [[secondary|Secondary]]나 [[ghost|Ghost]]로 낮추며, 되돌리기 어려운 파괴적 동작은 [[destructive|Destructive]] 스타일로 구분합니다.",
    anatomy: [
      {
        name: "Container",
        role: "배경, 테두리, 반경과 [[hover|호버]]·[[focus|포커스]]·[[disabled|비활성]] 상태를 담당하는 버튼 영역입니다.",
      },
      {
        name: "Icon",
        role: '동작의 의미를 빠르게 전달하며, 아이콘만 둘 때는 size="icon"과 aria-label을 함께 씁니다.',
      },
      {
        name: "Label",
        role: "버튼을 눌렀을 때 일어나는 동작을 한두 단어로 짧게 적습니다.",
      },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "버튼으로 [[focus|포커스]]를 이동합니다." },
        { keys: "Enter", action: "[[focus|포커스]]된 버튼을 실행합니다." },
        { keys: "Space", action: "[[focus|포커스]]된 버튼을 실행합니다." },
      ],
      notes: [
        '아이콘만 넣은 버튼(size="icon")에는 aria-label로 동작 이름을 반드시 적습니다.',
        '폼 안에서 제출이 아닌 버튼에는 type="button"을 명시하고, 링크로 합성할 때는 nativeButton={false}를 함께 넘깁니다.',
      ],
    },
    related: [
      {
        slug: "toggle",
        reason: "한 번 실행하고 끝나는 동작은 Button, 눌린 상태를 유지하는 동작은 Toggle을 씁니다.",
      },
      {
        slug: "toggle-group",
        reason: "정렬이나 보기 모드처럼 여러 옵션 중 선택 상태를 유지할 때 씁니다.",
      },
      {
        slug: "menu",
        reason: "한 버튼 자리에 관련 동작이 여러 개 모여 펼쳐야 할 때 씁니다.",
      },
    ],
  },

  dialog: {
    usage:
      "현재 화면의 맥락을 유지한 채 짧은 입력 폼이나 설정을 빠르게 마쳐야 할 때 씁니다. 배경 작업을 잠시 멈추고 사용자의 주의를 모으는 [[modal|모달]]로, 작업을 끝내면 원래 자리로 돌아옵니다.",
    anatomy: [
      {
        name: "Dialog",
        role: "[[modal|모달]]의 열림 상태와 [[overlay|오버레이]] 컨텍스트를 관리하는 최상위 래퍼입니다.",
      },
      {
        name: "DialogTrigger",
        role: "클릭이나 키보드 입력으로 [[modal|모달]]을 여는 트리거 요소입니다.",
      },
      {
        name: "DialogContent",
        role: "[[backdrop|백드롭]]과 패널 본체를 렌더링하며 기본 닫기 버튼을 포함합니다(showCloseButton={false}로 숨길 수 있습니다).",
      },
      {
        name: "DialogHeader",
        role: "제목과 보조 설명을 상단에 묶어 배치하는 영역입니다.",
      },
      {
        name: "DialogTitle",
        role: "[[modal|모달]]의 목적을 알리는 제목이며 [[screen-reader|스크린 리더]]의 레이블로 연결됩니다.",
      },
      {
        name: "DialogDescription",
        role: "작업의 맥락이나 주의 사항을 한두 문장으로 보충하는 설명입니다.",
      },
      {
        name: "DialogFooter",
        role: "좁은 화면에서는 버튼을 세로로 쌓고, 넓은 화면(sm 이상)에서는 가로로 나란히 배치합니다.",
      },
      {
        name: "DialogClose",
        role: "취소 버튼 등 내부 동작으로 [[modal|모달]]을 닫을 때 감싸는 요소입니다.",
      },
    ],
    accessibility: {
      keys: [
        {
          keys: "Tab",
          action: "[[modal|모달]] 안의 다음 [[focus|포커스]] 가능한 요소로 이동합니다.",
        },
        {
          keys: "Shift+Tab",
          action: "[[modal|모달]] 안의 이전 [[focus|포커스]] 가능한 요소로 이동합니다.",
        },
        {
          keys: "Esc",
          action: "[[modal|모달]]을 닫고 열었던 트리거로 [[focus|포커스]]를 되돌립니다.",
        },
      ],
      notes: [
        "DialogTitle은 [[screen-reader|스크린 리더]]가 [[modal|모달]] 이름을 읽을 수 있도록 반드시 포함합니다.",
        "닫기 버튼을 showCloseButton={false}로 숨긴 경우에도 DialogClose로 닫는 경로를 남겨 둡니다.",
      ],
    },
    related: [
      {
        slug: "alert-dialog",
        reason: "바깥 클릭으로 닫혀서는 안 되는 파괴적 확인은 Alert Dialog를 씁니다.",
      },
      {
        slug: "bottom-sheet",
        reason: "화면 아래에서 올라와 끌어내려 닫는 모바일 패널이 필요할 때 씁니다.",
      },
      {
        slug: "popover",
        reason: "배경을 막지 않고 트리거 옆에 짧은 설정이나 안내만 띄울 때 씁니다.",
      },
    ],
  },

  "bottom-sheet": {
    usage:
      "화면 아래에서 올라와 한 손으로 조작하고 아래로 끌어내려 닫는 [[overlay|오버레이]] 패널입니다. 필터 선택, 항목 작업 목록, 짧은 입력처럼 좁은 화면에서 엄지가 닿는 영역에 두어야 하는 작업에 씁니다.",
    anatomy: [
      {
        name: "BottomSheet",
        role: "바텀시트의 열림 상태와 아래로 끌어내려 닫는 제스처를 관리하는 최상위 래퍼입니다.",
      },
      {
        name: "BottomSheetTrigger",
        role: "탭이나 키보드 입력으로 바텀시트를 여는 트리거 요소입니다.",
      },
      {
        name: "BottomSheetContent",
        role: "배경 딤과 시트 본체를 렌더링하며 최대 높이 85dvh, 내부 스크롤, 하단 safe area 여백을 기본 적용합니다.",
      },
      {
        name: "BottomSheetTitle",
        role: "바텀시트의 목적을 알리는 제목이며 스크린 리더의 레이블로 연결됩니다.",
      },
      {
        name: "BottomSheetDescription",
        role: "선택이나 입력의 맥락을 한두 문장으로 보충하는 설명입니다.",
      },
      {
        name: "BottomSheetFooter",
        role: "확인·적용 같은 하단 실행 버튼을 배치하는 영역입니다.",
      },
      {
        name: "BottomSheetClose",
        role: "취소나 완료 버튼으로 바텀시트를 닫을 때 감싸는 요소입니다.",
      },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "바텀시트 안의 다음 포커스 가능한 요소로 이동합니다." },
        { keys: "Shift+Tab", action: "바텀시트 안의 이전 포커스 가능한 요소로 이동합니다." },
        { keys: "Esc", action: "바텀시트를 닫고 열었던 트리거로 포커스를 되돌립니다." },
      ],
      notes: [
        "BottomSheetTitle은 스크린 리더가 시트 이름을 읽을 수 있도록 반드시 포함합니다.",
        "열려 있는 동안 포커스를 시트 안에 가두며, 스와이프·Esc·바깥 클릭으로 닫으면 트리거로 포커스가 돌아옵니다.",
      ],
    },
    related: [
      {
        slug: "dialog",
        reason: "화면 폭에 따라 중앙 모달과 바텀시트를 자동 전환할 때 ResponsiveDialog를 씁니다.",
      },
      {
        slug: "drawer",
        reason: "화면 아래가 아니라 좌우 측면에서 열리는 탐색·필터 패널은 Drawer를 씁니다.",
      },
      {
        slug: "alert-dialog",
        reason: "스와이프나 바깥 클릭으로 실수로 닫히면 안 되는 확인은 Alert Dialog를 씁니다.",
      },
    ],
  },
};

export const ADAPTIVE_LINKS: Partial<Record<string, { section: string; summary: string }>> = {
  dialog: {
    section: "dialog-to-sheet",
    summary: "64rem 미만에서는 ResponsiveDialog가 중앙 모달을 BottomSheet로 자동 전환합니다.",
  },
  popover: {
    section: "popover-to-sheet",
    summary:
      '64rem 미만에서는 ResponsivePopover가 팝오버를 BottomSheet로 전환하며, mobile="popover"로 유지할 수도 있습니다.',
  },
  select: {
    section: "list-to-sheet",
    summary:
      "자동 전환 래퍼가 없으므로 64rem 미만에서는 useIsMobile로 분기해 BottomSheet 목록으로 보여 줍니다.",
  },
  menu: {
    section: "list-to-sheet",
    summary:
      "자동 전환 래퍼가 없으므로 64rem 미만에서는 useIsMobile로 분기해 BottomSheet에 44px 이상 항목을 배치합니다.",
  },
  combobox: {
    section: "list-to-sheet",
    summary:
      "가상 키보드가 드롭다운을 가리지 않도록 64rem 미만에서는 useIsMobile로 분기해 BottomSheet에서 검색합니다.",
  },
  autocomplete: {
    section: "list-to-sheet",
    summary:
      "좁은 화면에서는 useIsMobile로 분기해 BottomSheet나 독립 스크롤 목록으로 추천 항목을 보여 줍니다.",
  },
  "context-menu": {
    section: "list-to-sheet",
    summary:
      "터치 환경에는 우클릭이 없으므로 더보기 버튼과 useIsMobile 분기 BottomSheet로 같은 동작을 제공합니다.",
  },
  "alert-dialog": {
    section: "keep-centered",
    summary: "파괴적 확인은 바텀시트로 전환하지 않고 모바일에서도 중앙 모달을 그대로 유지합니다.",
  },
  "bottom-sheet": {
    section: "adaptive-criteria",
    summary: "64rem 미만에서 어떤 오버레이를 BottomSheet로 전환하고 유지할지 기준을 확인합니다.",
  },
};
