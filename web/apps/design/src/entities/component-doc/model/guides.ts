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

  input: {
    usage:
      "이름, 이메일, 검색어처럼 한 줄의 짧은 텍스트를 입력받을 때 씁니다. 항상 부모 너비를 채우며, [[validation|유효성 검사]] 실패 시 오류 테두리와 접근성 상태를 함께 표시합니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "다음 입력 칸이나 조작 요소로 [[focus|포커스]]를 이동합니다." },
        {
          keys: "Shift+Tab",
          action: "이전 입력 칸이나 조작 요소로 [[focus|포커스]]를 이동합니다.",
        },
      ],
      notes: [
        "모든 입력 칸에는 label 요소를 연결하거나 aria-label로 [[accessible-name|접근 가능한 이름]]을 제공합니다.",
        "[[validation|유효성 검사]] 오류는 테두리 변화만으로 알리지 말고 원인과 수정 방법을 담은 오류 문구를 함께 둡니다.",
        "disabled는 [[focus|포커스]]와 폼 제출에서 빠지고, readOnly는 [[focus|포커스]]와 폼 제출을 유지한 채 편집만 막습니다.",
      ],
    },
    related: [
      {
        slug: "textarea",
        reason: "설문 답변이나 메모처럼 여러 줄의 긴 글을 입력받을 때 씁니다.",
      },
      {
        slug: "combobox",
        reason: "직접 입력으로 후보를 검색해 목록에서 값을 고를 때 씁니다.",
      },
      {
        slug: "otp-field",
        reason: "인증번호처럼 자릿수가 고정된 코드를 칸마다 나누어 입력받을 때 씁니다.",
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

  textarea: {
    usage:
      "설명, 메모, 문의 내용처럼 여러 줄의 긴 텍스트를 입력받을 때 씁니다. [[validation|유효성 검사]]에 실패하면 오류 테두리와 접근성 상태를 함께 표시합니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "다음 입력 칸이나 조작 요소로 [[focus|포커스]]를 이동합니다." },
        {
          keys: "Shift+Tab",
          action: "이전 입력 칸이나 조작 요소로 [[focus|포커스]]를 이동합니다.",
        },
        { keys: "Enter", action: "입력 중인 내용에 줄바꿈을 추가합니다." },
      ],
      notes: [
        "label 요소를 연결하거나 aria-label로 [[accessible-name|접근 가능한 이름]]을 반드시 제공합니다.",
        "[[validation|유효성 검사]] 오류는 테두리 변화만으로 알리지 말고 원인 문구를 함께 표시합니다.",
        "글자 수 제한이 있으면 현재 입력 길이와 최대 길이를 필드 주변에 함께 알립니다.",
      ],
    },
    related: [
      {
        slug: "input",
        reason: "이름이나 이메일처럼 한 줄의 짧은 텍스트를 입력받을 때 씁니다.",
      },
      {
        slug: "alert",
        reason: "폼 전체의 제출 오류나 안내 메시지를 묶어 보여 줄 때 씁니다.",
      },
    ],
  },

  switch: {
    usage:
      "알림 수신이나 기능 활성화처럼 켜짐과 꺼짐을 즉시 반영하는 설정에 씁니다. 별도 저장 버튼 없이 누르는 순간 상태가 바뀌는 항목에 어울립니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "스위치로 [[focus|포커스]]를 이동합니다." },
        { keys: "Space", action: "켜짐과 꺼짐 상태를 전환합니다." },
        { keys: "Enter", action: "켜짐과 꺼짐 상태를 전환합니다." },
      ],
      notes: [
        "스위치 옆의 설정 문구를 label로 연결해 [[accessible-name|접근 가능한 이름]]과 [[touch-target|터치 영역]]을 함께 확보합니다.",
        "[[disabled|비활성]] 상태일 때는 왜 바꿀 수 없는지 주변 설명으로 함께 알립니다.",
      ],
    },
    related: [
      {
        slug: "checkbox",
        reason: "여러 항목을 고르거나 폼 제출 시 함께 저장하는 선택에는 Checkbox를 씁니다.",
      },
      {
        slug: "toggle",
        reason: "툴바에서 굵게·정렬처럼 버튼 형태로 상태를 켜고 끌 때 씁니다.",
      },
    ],
  },

  checkbox: {
    usage:
      "약관 동의나 목록의 다중 선택처럼 하나 이상의 항목을 독립적으로 고를 때 씁니다. 폼 제출과 함께 저장되는 선택이나 전체 선택의 부분 상태를 표현할 때 적합합니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "체크박스로 [[focus|포커스]]를 이동합니다." },
        { keys: "Space", action: "선택 상태를 전환합니다." },
      ],
      notes: [
        "라벨 텍스트 전체를 클릭할 수 있도록 label 요소로 묶어 [[touch-target|터치 영역]]을 넓힙니다.",
        "관련된 체크박스 묶음은 fieldset과 legend로 그룹 이름을 제공합니다.",
      ],
    },
    related: [
      {
        slug: "switch",
        reason: "저장 버튼 없이 설정을 즉시 켜고 끄는 동작은 Switch를 씁니다.",
      },
      {
        slug: "radio-group",
        reason: "여러 선택지 중 반드시 하나만 골라야 할 때 씁니다.",
      },
    ],
  },

  badge: {
    usage:
      "상태, 분류, 개수처럼 짧은 메타 정보를 항목 옆에 붙여 한눈에 구분할 때 씁니다. 여러 [[variant|변형]]으로 정보의 강조 수준을 조절합니다.",
    accessibility: {
      keys: [],
      notes: [
        "상태가 실시간으로 바뀌어 [[screen-reader|스크린 리더]]에 알려야 할 때만 aria-live를 함께 씁니다.",
        "배지 색만 보지 않아도 뜻을 알 수 있게 짧은 텍스트 라벨을 함께 적습니다.",
      ],
    },
    related: [
      {
        slug: "button",
        reason: "클릭해 동작을 실행하거나 필터를 해제하는 상호작용이 필요하면 Button을 씁니다.",
      },
      {
        slug: "alert",
        reason: "문장 단위의 상태 설명이나 오류 안내를 전달할 때 씁니다.",
      },
    ],
  },

  card: {
    usage:
      "서로 관련된 제목, 설명, 지표, 실행 동작을 하나의 구획으로 묶어 보여 줄 때 씁니다. 목록이나 대시보드에서 정보 단위를 명확히 나누는 기본 표면입니다.",
    anatomy: [
      {
        name: "Card",
        role: "경계선, 배경, 여백과 클릭 가능 상태를 담당하는 카드 외곽 컨테이너입니다.",
      },
      { name: "CardHeader", role: "제목과 보조 설명을 상단에 묶어 배치하는 영역입니다." },
      { name: "CardTitle", role: "카드가 다루는 대상이나 주제를 알리는 제목입니다." },
      { name: "CardDescription", role: "제목 아래에 맥락을 짧게 보충하는 설명입니다." },
      { name: "CardContent", role: "본문 텍스트, 폼, 지표 등 핵심 내용을 담는 영역입니다." },
      { name: "CardFooter", role: "카드 하단에 보조 정보나 실행 버튼을 배치하는 영역입니다." },
    ],
    accessibility: {
      keys: [],
      notes: [
        "카드 전체를 클릭 대상으로 만들 때는 내부에 버튼이나 다른 링크가 중첩되지 않게 구성합니다.",
        "페이지의 제목 위계에 맞춰 CardTitle의 시맨틱 수준을 일관되게 유지합니다.",
      ],
    },
    related: [
      {
        slug: "alert",
        reason: "오류·경고·성공 같은 상태 피드백을 강조해 알릴 때 씁니다.",
      },
      {
        slug: "separator",
        reason: "카드 외곽 없이 단순한 경계선으로 영역만 나눌 때 씁니다.",
      },
    ],
  },

  alert: {
    usage:
      "오류, 경고, 완료 안내처럼 사용자가 현재 화면 안에서 꼭 읽어야 하는 상태 메시지를 전달할 때 씁니다. 페이지 흐름 안에 고정되어 사용자가 닫기 전까지 맥락을 유지합니다.",
    anatomy: [
      {
        name: "Alert",
        role: 'role="alert"를 포함해 상태 강조 스타일과 메시지 틀을 제공하는 컨테이너입니다.',
      },
      { name: "AlertTitle", role: "알림의 핵심 요지를 한 줄로 요약하는 제목입니다." },
      { name: "AlertDescription", role: "원인이나 사용자가 취할 다음 행동을 설명하는 본문입니다." },
    ],
    accessibility: {
      keys: [],
      notes: [
        "긴급한 오류나 상태 변경이 아닌 단순 상시 안내에는 과도한 알림을 막기 위해 role을 조정합니다.",
        "아이콘이나 색에만 의존하지 않고 제목과 설명으로 상태 의미를 명확히 적습니다.",
      ],
    },
    related: [
      {
        slug: "toast",
        reason: "저장 완료처럼 잠시 띄웠다 사라져도 되는 일시적 피드백은 Toast를 씁니다.",
      },
      {
        slug: "alert-dialog",
        reason: "배경 조작을 멈추고 사용자의 확인 응답을 받아야 할 때 씁니다.",
      },
    ],
  },

  separator: {
    usage:
      "서로 다른 정보 묶음이나 메뉴 구역을 시각적으로 나눌 때 씁니다. 가로 방향과 세로 방향 구분을 모두 지원하며, 긴 글이나 섹션 사이에는 물결 형태로 여유 있게 구획을 나눌 수 있습니다.",
    accessibility: {
      keys: [],
      notes: [
        '단순 장식용 선이라면 aria-hidden="true"로 [[screen-reader|스크린 리더]] 탐색에서 제외합니다.',
        "세로 구분선은 orientation을 vertical로 지정해 보조 기기에 방향 정보를 정확히 전달합니다.",
      ],
    },
    related: [
      {
        slug: "card",
        reason: "선으로만 나누기보다 독립된 표면으로 항목을 묶어 강조할 때 씁니다.",
      },
      {
        slug: "menu",
        reason: "메뉴 항목 사이의 구분은 MenuSeparator를 씁니다.",
      },
    ],
  },

  skeleton: {
    usage:
      "데이터를 불러오는 [[loading-state|로딩 상태]]에서 콘텐츠가 들어올 자리를 미리 보여 줄 때 씁니다. 실제 카드나 텍스트 높이에 맞춰 배치해 로딩 완료 시 화면 흔들림을 줄입니다.",
    accessibility: {
      keys: [],
      notes: [
        '개별 스켈레톤은 aria-hidden="true"로 숨기고, 감싸는 컨테이너에 aria-busy="true"를 붙여 로딩 중임을 알립니다.',
        "로딩이 끝나면 aria-busy를 해제해 [[screen-reader|스크린 리더]]가 새 콘텐츠를 읽을 수 있게 합니다.",
      ],
    },
    related: [
      {
        slug: "progress",
        reason: "파일 업로드처럼 진행률을 수치로 보여 줄 수 있는 작업은 Progress를 씁니다.",
      },
      {
        slug: "card",
        reason: "실제 데이터가 도착했을 때 스켈레톤과 같은 크기의 카드로 교체합니다.",
      },
    ],
  },

  table: {
    usage:
      "여러 항목의 속성을 행과 열로 나란히 비교하거나 정렬·스캔해야 할 때 씁니다. 높은 [[density|밀도]]로 구조화된 데이터를 빠르게 훑어보는 목록 화면에 적합합니다.",
    anatomy: [
      {
        name: "Table",
        role: "가로 스크롤 래퍼와 표 본체를 함께 렌더링하는 최상위 컨테이너입니다.",
      },
      { name: "TableHeader", role: "열 제목 행을 묶는 헤더 영역입니다." },
      { name: "TableBody", role: "실제 데이터 행들을 담는 본문 영역입니다." },
      { name: "TableRow", role: "하나의 항목을 가로 한 줄로 표현하는 행입니다." },
      { name: "TableHead", role: "각 열의 이름과 정렬 기준을 나타내는 헤더 셀입니다." },
      { name: "TableCell", role: "개별 데이터 값을 표시하는 본문 셀입니다." },
    ],
    accessibility: {
      keys: [],
      notes: [
        "표의 주제를 알 수 있도록 caption을 두거나 주변 제목과 aria-labelledby로 연결합니다.",
        "열·행 헤더 셀에는 scope 속성을 명시해 [[screen-reader|스크린 리더]]가 셀과 헤더의 관계를 읽게 합니다.",
        "데이터가 없을 때는 빈 표 대신 원인과 다음 행동을 담은 [[empty-state|빈 상태]]를 보여 줍니다.",
      ],
    },
    related: [
      {
        slug: "card",
        reason: "좁은 화면에서 열이 많아 비교하기 어려우면 카드 목록으로 전환합니다.",
      },
      {
        slug: "scroll-area",
        reason: "표 외의 영역에서 커스텀 스크롤바를 맞춰야 할 때 씁니다.",
      },
    ],
  },

  tabs: {
    usage:
      "같은 맥락에 속한 여러 보기나 설정 구획을 한 화면 안에서 전환할 때 씁니다. 페이지 전체를 이동하지 않고 같은 자리의 콘텐츠만 바꿀 때 적합합니다.",
    anatomy: [
      { name: "Tabs", role: "활성 탭 상태와 패널 연결을 관리하는 최상위 컨테이너입니다." },
      { name: "TabsList", role: "탭 버튼들을 한 줄로 묶어 배치하는 목록 영역입니다." },
      { name: "TabsTrigger", role: "클릭이나 키보드로 특정 패널을 활성화하는 탭 버튼입니다." },
      { name: "TabsContent", role: "선택된 탭에 대응하는 본문을 표시하는 패널입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "활성 탭과 패널 본문 사이로 [[focus|포커스]]를 이동합니다." },
        { keys: "ArrowLeft / ArrowRight", action: "탭 목록 안에서 이전·다음 탭으로 이동합니다." },
        { keys: "Home / End", action: "첫 번째 또는 마지막 탭으로 바로 이동합니다." },
      ],
      notes: [
        "탭 라벨은 한두 단어로 짧게 써서 좁은 폭에서도 줄바꿈이나 잘림이 생기지 않게 합니다.",
        "탭 전환으로 URL이 바뀌어야 하는 탐색에는 일반 링크나 라우터를 씁니다.",
      ],
    },
    related: [
      {
        slug: "toggle-group",
        reason: "본문 패널을 바꾸는 것이 아니라 정렬·보기 옵션만 고를 때 씁니다.",
      },
      {
        slug: "navigation-menu",
        reason: "다른 페이지로 이동하는 전역 사이트 탐색은 Navigation Menu를 씁니다.",
      },
    ],
  },

  toggle: {
    usage:
      "글꼴 굵게, 즐겨찾기, 음소거처럼 버튼 하나를 눌러 켜짐과 꺼짐 상태를 유지할 때 씁니다. 툴바나 편집 도구 안에서 현재 적용된 상태를 바로 보여 줄 때 적합합니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "토글 버튼으로 [[focus|포커스]]를 이동합니다." },
        { keys: "Enter", action: "눌림 상태를 전환합니다." },
        { keys: "Space", action: "눌림 상태를 전환합니다." },
      ],
      notes: [
        "아이콘만 표시하는 토글에는 aria-label로 [[accessible-name|접근 가능한 이름]]을 반드시 적습니다.",
        "눌린 상태가 바뀌어도 버튼 라벨 자체를 바꾸지 말고 눌림 상태로만 표현합니다.",
      ],
    },
    related: [
      {
        slug: "button",
        reason: "상태를 유지하지 않고 한 번 실행하고 끝나는 동작은 Button을 씁니다.",
      },
      {
        slug: "toggle-group",
        reason: "서로 관련된 토글 여러 개를 묶어 단일·다중 선택으로 관리할 때 씁니다.",
      },
      {
        slug: "switch",
        reason: "설정 화면에서 기능 켜짐·꺼짐을 명확히 구분할 때 씁니다.",
      },
    ],
  },

  "toggle-group": {
    usage:
      "텍스트 정렬, 보기 방식, 기간 필터처럼 서로 관련된 옵션 묶음에서 하나 또는 여러 개를 고를 때 씁니다. 선택지가 적고 모든 옵션을 한눈에 펼쳐 두어야 할 때 적합합니다.",
    anatomy: [
      {
        name: "ToggleGroup",
        role: "단일·다중 선택 상태와 그룹 내부 [[keyboard-navigation|키보드 탐색]]을 관리하는 컨테이너입니다.",
      },
      {
        name: "ToggleGroupItem",
        role: "그룹 안에서 개별 옵션을 선택하거나 해제하는 토글 버튼입니다.",
      },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "토글 그룹으로 [[focus|포커스]]를 이동합니다." },
        { keys: "ArrowLeft / ArrowRight", action: "그룹 안의 이전·다음 항목으로 이동합니다." },
        { keys: "Enter / Space", action: "현재 항목의 선택 상태를 전환합니다." },
      ],
      notes: [
        "ToggleGroup에 aria-label을 붙여 어떤 기준의 선택 묶음인지 [[screen-reader|스크린 리더]]에 알립니다.",
        "아이콘만 들어간 항목에도 각각 aria-label로 [[accessible-name|접근 가능한 이름]]을 적습니다.",
      ],
    },
    related: [
      {
        slug: "tabs",
        reason: "선택에 따라 아래 본문 패널 전체가 바뀌어야 할 때는 Tabs를 씁니다.",
      },
      {
        slug: "radio-group",
        reason: "폼 안에서 설명이 붙은 선택지 중 하나를 고를 때 씁니다.",
      },
      {
        slug: "select",
        reason: "선택지가 많아 한 줄에 펼쳐 두기 어려울 때 씁니다.",
      },
    ],
  },

  select: {
    usage:
      "정해진 목록에서 하나의 값을 고르되 공간을 절약해야 할 때 씁니다. 선택지가 여러 개여서 화면에 모두 펼쳐 두기 부담스러운 폼이나 필터에 적합합니다.",
    anatomy: [
      { name: "Select", role: "선택 값과 팝업 열림 상태를 관리하는 최상위 래퍼입니다." },
      { name: "SelectTrigger", role: "현재 선택된 값을 보여 주고 목록을 여는 버튼입니다." },
      { name: "SelectValue", role: "선택된 항목의 라벨이나 자리 표시 문구를 출력합니다." },
      { name: "SelectContent", role: "선택지 목록을 띄우는 팝업 컨테이너입니다." },
      { name: "SelectGroup", role: "성격이 같은 선택지들을 묶어 정리하는 그룹입니다." },
      { name: "SelectItem", role: "목록 안에서 선택할 수 있는 개별 옵션입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Enter / Space", action: "선택 목록을 열거나 강조된 항목을 선택합니다." },
        { keys: "ArrowUp / ArrowDown", action: "목록 안의 이전·다음 항목으로 이동합니다." },
        { keys: "Esc", action: "값을 바꾸지 않고 목록을 닫습니다." },
      ],
      notes: [
        "SelectTrigger에 label이나 aria-label을 연결해 어떤 항목을 고르는지 알립니다.",
        "선택지가 많아 검색이 필요하면 [[combobox|Combobox]]로 전환하고, 좁은 화면에서는 [[bottom-sheet|Bottom Sheet]] 목록을 고려합니다.",
      ],
    },
    related: [
      {
        slug: "combobox",
        reason: "선택지가 많아 텍스트 검색으로 후보를 좁혀야 할 때 씁니다.",
      },
      {
        slug: "radio-group",
        reason: "선택지가 2~4개뿐이라 모든 옵션을 펼쳐 두고 비교할 때 씁니다.",
      },
      {
        slug: "menu",
        reason: "값을 고르는 것이 아니라 즉시 실행할 동작 목록을 띄울 때 씁니다.",
      },
    ],
  },

  tooltip: {
    usage:
      "아이콘 버튼의 이름이나 짧은 단축키처럼 화면을 어지럽히지 않고 보조 설명만 덧붙일 때 씁니다. [[hover|호버]]나 [[focus|포커스]] 시 잠시 나타나는 [[non-modal|비모달]] 말풍선입니다.",
    anatomy: [
      {
        name: "TooltipProvider",
        role: "여러 툴팁의 열림 지연과 전환 타이밍을 공유하는 상위 프로바이더입니다.",
      },
      { name: "Tooltip", role: "개별 툴팁의 열림 상태를 관리하는 래퍼입니다." },
      {
        name: "TooltipTrigger",
        role: "[[hover|호버]]나 [[focus|포커스]]를 받아 툴팁을 띄우는 대상 요소입니다.",
      },
      { name: "TooltipContent", role: "짧은 안내 문구를 표시하는 말풍선 본체입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "트리거 요소에 [[focus|포커스]]를 옮겨 툴팁을 엽니다." },
        { keys: "Esc", action: "열려 있는 툴팁을 즉시 닫습니다." },
      ],
      notes: [
        "터치 기기에는 [[hover|호버]]가 없으므로 필수 정보나 오류 안내를 Tooltip 안에만 두지 않습니다.",
        "툴팁 안에는 버튼이나 링크 같은 상호작용 요소를 넣지 않습니다.",
      ],
    },
    related: [
      {
        slug: "popover",
        reason: "클릭으로 열고 닫으며 내부에 버튼이나 입력 요소가 필요할 때 씁니다.",
      },
      {
        slug: "preview-card",
        reason: "링크나 사용자 프로필의 풍부한 요약 카드를 미리 볼 때 씁니다.",
      },
    ],
  },

  popover: {
    usage:
      "트리거 요소 근처에 짧은 설정, 필터 옵션, 보조 정보를 띄우는 [[non-modal|비모달]] [[overlay|오버레이]]입니다. 배경 화면을 완전히 가리지 않고 가벼운 조작을 마칠 때 씁니다.",
    anatomy: [
      { name: "Popover", role: "팝오버의 열림 상태와 앵커 연결을 관리하는 최상위 래퍼입니다." },
      { name: "PopoverTrigger", role: "클릭으로 팝오버를 열고 닫는 트리거 요소입니다." },
      { name: "PopoverContent", role: "트리거 기준으로 배치되는 팝오버 본체입니다." },
      { name: "PopoverTitle", role: "팝오버의 주제를 알리는 제목입니다." },
      { name: "PopoverDescription", role: "팝오버 내용을 짧게 보충하는 설명입니다." },
      { name: "PopoverClose", role: "내부 버튼으로 팝오버를 닫을 때 감싸는 요소입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Enter / Space", action: "트리거에서 팝오버를 열거나 닫습니다." },
        { keys: "Tab", action: "팝오버 안의 조작 요소로 [[focus|포커스]]를 이동합니다." },
        { keys: "Esc", action: "팝오버를 닫고 트리거로 [[focus|포커스]]를 되돌립니다." },
      ],
      notes: [
        "팝오버에 제목이 있으면 PopoverTitle을 써서 [[screen-reader|스크린 리더]]에 맥락을 연결합니다.",
        "내용이 길거나 좁은 화면에서 잘리기 쉬우면 ResponsivePopover로 [[bottom-sheet|Bottom Sheet]] 전환을 씁니다.",
      ],
    },
    related: [
      {
        slug: "dialog",
        reason: "배경 조작을 막고 집중된 입력이나 확인이 필요할 때 씁니다.",
      },
      {
        slug: "tooltip",
        reason: "상호작용 없이 한 줄 설명만 [[hover|호버]]로 띄울 때 씁니다.",
      },
      {
        slug: "menu",
        reason: "설정 폼 대신 즉시 실행할 명령 목록을 나열할 때 씁니다.",
      },
    ],
  },

  menu: {
    usage:
      "복제, 이름 변경, 삭제처럼 한 항목에 딸린 여러 동작을 버튼 하나로 묶어 펼칠 때 씁니다. 화면에 모든 버튼을 늘어놓지 않고 필요할 때만 동작 목록을 보여 줍니다.",
    anatomy: [
      { name: "Menu", role: "메뉴의 열림 상태와 항목 탐색을 관리하는 최상위 래퍼입니다." },
      { name: "MenuTrigger", role: "클릭이나 키보드로 메뉴를 여는 트리거 버튼입니다." },
      { name: "MenuContent", role: "동작 항목들을 담아 띄우는 팝업 패널입니다." },
      { name: "MenuGroup", role: "성격이 같은 메뉴 항목들을 묶는 그룹입니다." },
      { name: "MenuLabel", role: "메뉴 그룹의 성격을 알리는 비클릭 제목입니다." },
      { name: "MenuItem", role: "클릭이나 Enter로 동작을 실행하는 개별 항목입니다." },
      { name: "MenuSeparator", role: "일반 동작과 위험 동작 같은 구역을 나누는 구분선입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Enter / Space", action: "메뉴를 열거나 강조된 항목을 실행합니다." },
        { keys: "ArrowUp / ArrowDown", action: "메뉴 안의 이전·다음 항목으로 이동합니다." },
        { keys: "Esc", action: "메뉴를 닫고 트리거로 [[focus|포커스]]를 되돌립니다." },
      ],
      notes: [
        "삭제처럼 되돌리기 어려운 항목은 MenuSeparator 아래에 두고 [[destructive|Destructive]] 스타일로 구분합니다.",
        "아이콘만 있는 더보기 트리거에는 aria-label로 [[accessible-name|접근 가능한 이름]]을 적습니다.",
      ],
    },
    related: [
      {
        slug: "select",
        reason: "명령 실행이 아니라 폼에서 하나의 값을 선택해 유지할 때 씁니다.",
      },
      {
        slug: "context-menu",
        reason: "트리거 버튼 대신 항목 위 우클릭으로 동작 목록을 열 때 씁니다.",
      },
      {
        slug: "menubar",
        reason: "파일·편집처럼 여러 메뉴를 상단 바에 나란히 묶어 쓸 때 씁니다.",
      },
    ],
  },

  "alert-dialog": {
    usage:
      "삭제, 탈퇴, 초기화처럼 되돌릴 수 없는 작업을 실행하기 전에 사용자의 명시적인 확인을 받는 [[modal|모달]]입니다. 바깥 클릭으로 실수로 닫히지 않고 내부 버튼으로만 결정을 끝냅니다.",
    anatomy: [
      {
        name: "AlertDialog",
        role: "확인창의 열림 상태와 [[focus-trap|포커스 트랩]]을 관리하는 최상위 래퍼입니다.",
      },
      { name: "AlertDialogTrigger", role: "확인창을 여는 트리거 요소입니다." },
      {
        name: "AlertDialogContent",
        role: "[[backdrop|배경 막]]과 중앙 확인창 본체를 렌더링합니다.",
      },
      { name: "AlertDialogTitle", role: "확인할 위험 동작을 분명히 알리는 제목입니다." },
      {
        name: "AlertDialogDescription",
        role: "실행 시 잃게 되는 데이터나 영향을 설명하는 본문입니다.",
      },
      { name: "AlertDialogFooter", role: "취소와 실행 버튼을 배치하는 하단 영역입니다." },
      { name: "AlertDialogClose", role: "취소나 확인 뒤 창을 닫는 버튼 래퍼입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "확인창 안의 다음 버튼으로 [[focus|포커스]]를 이동합니다." },
        { keys: "Shift+Tab", action: "확인창 안의 이전 버튼으로 [[focus|포커스]]를 이동합니다." },
        { keys: "Esc", action: "작업을 실행하지 않고 확인창을 닫습니다." },
      ],
      notes: [
        "AlertDialogTitle과 AlertDialogDescription을 모두 채워 [[screen-reader|스크린 리더]]가 위험 내용을 바로 읽게 합니다.",
        "실행 버튼에는 '확인' 대신 '프로젝트 삭제'처럼 대상을 포함한 구체적 동사를 씁니다.",
      ],
    },
    related: [
      {
        slug: "dialog",
        reason: "파괴적 확인이 아니라 일반 입력 폼이나 설정을 띄울 때 씁니다.",
      },
      {
        slug: "toast",
        reason: "사전 확인 대신 실행 후 결과를 짧게 알릴 때 씁니다.",
      },
    ],
  },

  "radio-group": {
    usage:
      "결제 수단이나 공개 범위처럼 서로 배타적인 선택지 중에서 반드시 하나만 고를 때 씁니다. 선택지가 적어 모든 옵션을 한눈에 펼쳐 두고 비교할 때 적합합니다.",
    anatomy: [
      {
        name: "RadioGroup",
        role: "선택된 값과 그룹 내부의 화살표 키 순환을 관리하는 컨테이너입니다.",
      },
      { name: "RadioGroupItem", role: "그룹 안에서 하나의 옵션을 나타내는 라디오 버튼입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "라디오 그룹으로 [[focus|포커스]]를 이동합니다." },
        {
          keys: "ArrowUp / ArrowDown / ArrowLeft / ArrowRight",
          action: "이전·다음 옵션으로 이동하며 선택합니다.",
        },
        { keys: "Space", action: "[[focus|포커스]]된 옵션을 선택합니다." },
      ],
      notes: [
        "그룹 전체에 aria-label이나 fieldset·legend로 선택 주제를 연결합니다.",
        "각 RadioGroupItem은 label로 감싸 텍스트 전체가 [[touch-target|터치 영역]]이 되게 합니다.",
      ],
    },
    related: [
      {
        slug: "checkbox",
        reason: "여러 항목을 동시에 선택하거나 해제할 수 있어야 할 때 씁니다.",
      },
      {
        slug: "select",
        reason: "선택지가 많아 화면에 모두 펼쳐 두기 어려울 때 씁니다.",
      },
      {
        slug: "toggle-group",
        reason: "폼 항목 대신 툴바에서 버튼 묶음 형태로 옵션을 고를 때 씁니다.",
      },
    ],
  },

  slider: {
    usage:
      "음량, 밝기, 가격 범위처럼 연속된 숫자 구간에서 값을 직관적으로 조절할 때 씁니다. 드래그 도중 화면 스크롤과 겹치지 않도록 터치 제어가 적용되어 있습니다.",
    accessibility: {
      keys: [
        { keys: "Tab", action: "슬라이더 손잡이로 [[focus|포커스]]를 이동합니다." },
        {
          keys: "ArrowLeft / ArrowRight / ArrowUp / ArrowDown",
          action: "지정된 step 단위로 값을 줄이거나 늘립니다.",
        },
        { keys: "Home / End", action: "최솟값 또는 최댓값으로 즉시 이동합니다." },
      ],
      notes: [
        "슬라이더에 aria-label이나 aria-labelledby를 연결해 무엇을 조절하는지 알립니다.",
        "현재 값을 숫자로 함께 표시해 시각적으로나 정밀 조절 시 혼동을 줄입니다.",
      ],
    },
    related: [
      {
        slug: "input",
        reason: "정확한 숫자를 직접 타이핑해 입력해야 할 때는 Input을 씁니다.",
      },
      {
        slug: "progress",
        reason: "사용자가 조작하는 값이 아니라 진행 상태만 보여 줄 때 씁니다.",
      },
    ],
  },

  accordion: {
    usage:
      "자주 묻는 질문이나 여러 설정 구획을 제목만 보여 주고 필요할 때 펼쳐 읽게 할 때 씁니다. 긴 페이지를 구조화해 한 화면의 정보 부담을 줄이는 데 적합합니다.",
    anatomy: [
      {
        name: "Accordion",
        role: "단일·다중 열림 규칙과 항목 간 탐색을 관리하는 최상위 컨테이너입니다.",
      },
      { name: "AccordionItem", role: "하나의 제목과 본문 쌍을 묶는 항목 단위입니다." },
      {
        name: "AccordionTrigger",
        role: "클릭이나 키보드로 해당 항목을 접고 펼치는 헤더 버튼입니다.",
      },
      { name: "AccordionContent", role: "펼쳤을 때 드러나는 본문 패널입니다." },
    ],
    accessibility: {
      keys: [
        {
          keys: "Tab",
          action: "아코디언 트리거와 열린 본문 요소 사이로 [[focus|포커스]]를 이동합니다.",
        },
        { keys: "Enter / Space", action: "현재 항목을 펼치거나 접습니다." },
      ],
      notes: [
        "트리거 제목은 펼치기 전에 내용을 짐작할 수 있게 간결하고 명확하게 적습니다.",
        "필수 입력 항목이나 오류 메시지가 있는 구역은 접어 두지 않습니다.",
      ],
    },
    related: [
      {
        slug: "collapsible",
        reason: "여러 항목 묶음이 아니라 단일 영역 하나만 접고 펼칠 때 씁니다.",
      },
      {
        slug: "tabs",
        reason: "세로로 쌓지 않고 같은 자리에서 여러 보기 중 하나를 전환할 때 씁니다.",
      },
    ],
  },

  collapsible: {
    usage:
      "고급 필터나 부가 설명처럼 단일 영역 하나를 필요할 때만 펼쳐 보여 줄 때 씁니다. 아코디언처럼 여러 항목을 묶지 않고 독립된 구획 하나를 여닫을 때 적합합니다.",
    anatomy: [
      { name: "Collapsible", role: "단일 영역의 열림 상태를 관리하는 최상위 래퍼입니다." },
      {
        name: "CollapsibleTrigger",
        role: "클릭이나 키보드로 영역을 접고 펼치는 트리거 버튼입니다.",
      },
      { name: "CollapsibleContent", role: "열림 상태에 따라 표시되는 본문 영역입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "트리거 버튼으로 [[focus|포커스]]를 이동합니다." },
        { keys: "Enter", action: "영역을 펼치거나 접습니다." },
        { keys: "Space", action: "영역을 펼치거나 접습니다." },
      ],
      notes: [
        "트리거 라벨에 '고급 옵션 보기'처럼 펼쳤을 때 무엇이 나오는지 드러냅니다.",
        "핵심 입력이나 필수 안내는 접힌 영역 안에 숨기지 않습니다.",
      ],
    },
    related: [
      {
        slug: "accordion",
        reason: "여러 구획을 목록 형태로 묶어 함께 접고 펼칠 때 씁니다.",
      },
      {
        slug: "drawer",
        reason: "페이지 흐름을 밀어내지 않고 측면 [[overlay|오버레이]]로 보조 영역을 열 때 씁니다.",
      },
    ],
  },

  avatar: {
    usage:
      "사용자, 팀, 워크스페이스를 프로필 이미지나 이니셜로 빠르게 식별할 때 씁니다. 이미지가 없거나 불러오기에 실패하면 자동으로 대체 표시를 보여 줍니다.",
    anatomy: [
      { name: "Avatar", role: "크기와 원형·사각 비율을 지정하는 외곽 컨테이너입니다." },
      { name: "AvatarImage", role: "실제 프로필 이미지를 표시하는 요소입니다." },
      {
        name: "AvatarFallback",
        role: "이미지가 없거나 로드에 실패했을 때 이니셜이나 아이콘을 보여 줍니다.",
      },
    ],
    accessibility: {
      keys: [],
      notes: [
        "AvatarImage에는 사용자 이름을 담은 alt 텍스트를 적고, 옆에 이름이 이미 표기되어 있으면 빈 alt로 중복 낭독을 피합니다.",
        "AvatarFallback에는 1~2글자 이니셜을 넣어 배경과의 [[color-contrast|명도 대비]]를 유지합니다.",
      ],
    },
    related: [
      {
        slug: "badge",
        reason: "사람이나 팀 식별이 아니라 상태나 분류 라벨을 붙일 때 씁니다.",
      },
      {
        slug: "preview-card",
        reason: "아바타에 [[hover|호버]]했을 때 프로필 요약 카드를 함께 보여 줄 때 씁니다.",
      },
    ],
  },

  progress: {
    usage:
      "파일 업로드, 저장 용량, 단계별 완료율처럼 전체 대비 진행 정도를 수치로 보여 줄 때 씁니다. 작업이 얼마나 남았는지 막대 길이로 직관적으로 전달합니다.",
    accessibility: {
      keys: [],
      notes: [
        "진행 막대에 aria-label이나 주변 라벨을 연결해 어떤 작업의 진행률인지 알립니다.",
        "막대만 두지 말고 작업 이름과 퍼센트 수치를 함께 표기해 한눈에 읽히게 합니다.",
      ],
    },
    related: [
      {
        slug: "skeleton",
        reason: "진행률을 알 수 없는 초기 화면 [[loading-state|로딩 상태]]에는 Skeleton을 씁니다.",
      },
      {
        slug: "slider",
        reason: "진행 표시가 아니라 사용자가 값을 직접 조절해야 할 때 씁니다.",
      },
    ],
  },

  drawer: {
    usage:
      "화면 왼쪽이나 오른쪽 가장자리에서 슬라이드되어 나오는 [[drawer|드로어]] 패널입니다. 메인 본문의 맥락을 유지한 채 탐색 메뉴, 상세 필터, 속성 편집 패널을 열 때 씁니다.",
    anatomy: [
      {
        name: "Drawer",
        role: "드로어의 열림 상태와 [[overlay|오버레이]] 컨텍스트를 관리하는 최상위 래퍼입니다.",
      },
      { name: "DrawerTrigger", role: "클릭이나 키보드로 드로어를 여는 트리거 요소입니다." },
      {
        name: "DrawerContent",
        role: "[[backdrop|배경 막]]과 측면 패널 본체를 렌더링하며 기본 닫기 버튼을 포함합니다.",
      },
      {
        name: "DrawerTitle",
        role: "드로어의 목적을 알리는 제목이며 [[screen-reader|스크린 리더]]에 연결됩니다.",
      },
      { name: "DrawerDescription", role: "패널의 역할을 짧게 보충하는 설명입니다." },
      { name: "DrawerClose", role: "내부 버튼으로 드로어를 닫을 때 감싸는 요소입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "드로어 안의 다음 조작 요소로 [[focus|포커스]]를 이동합니다." },
        {
          keys: "Shift+Tab",
          action: "드로어 안의 이전 조작 요소로 [[focus|포커스]]를 이동합니다.",
        },
        { keys: "Esc", action: "드로어를 닫고 열었던 트리거로 [[focus|포커스]]를 되돌립니다." },
      ],
      notes: [
        "DrawerTitle을 반드시 포함해 [[screen-reader|스크린 리더]]가 패널 이름을 읽을 수 있게 합니다.",
        "닫기 버튼을 showCloseButton={false}로 숨긴 경우에도 DrawerClose로 닫는 경로를 제공합니다.",
      ],
    },
    related: [
      {
        slug: "bottom-sheet",
        reason:
          "화면 좌우가 아니라 아래에서 올라와 끌어내려 닫는 모바일 패널은 Bottom Sheet를 씁니다.",
      },
      {
        slug: "dialog",
        reason: "측면 패널이 아니라 화면 중앙에 집중된 짧은 입력·확인을 띄울 때 씁니다.",
      },
    ],
  },

  toast: {
    usage:
      "저장 완료, 링크 복사, 백그라운드 작업 결과처럼 잠시 알렸다가 자동으로 사라져도 되는 [[non-modal|비모달]] 알림에 씁니다. 사용자의 현재 작업을 방해하지 않고 짧은 피드백을 전달합니다.",
    accessibility: {
      keys: [],
      notes: [
        "오류 복구처럼 사용자가 꼭 읽고 대응해야 하는 중요한 메시지는 Toast 대신 [[alert|Alert]]로 화면에 고정합니다.",
        "토스트 문구는 사라지기 전에 읽을 수 있도록 한두 문장으로 짧게 적습니다.",
      ],
    },
    related: [
      {
        slug: "alert",
        reason: "자동으로 사라지면 안 되는 오류나 상시 안내는 Alert를 씁니다.",
      },
      {
        slug: "alert-dialog",
        reason: "결과 알림이 아니라 실행 전 사용자의 확인 응답을 받아야 할 때 씁니다.",
      },
    ],
  },

  combobox: {
    usage:
      "후보 목록이 많아 텍스트를 입력해 실시간으로 걸러낸 뒤 하나의 값을 선택할 때 씁니다. 국가, 담당자, 태그처럼 목록을 훑기만 해서는 찾기 어려운 선택에 적합합니다.",
    anatomy: [
      { name: "Combobox", role: "입력값, 필터링, 선택 상태를 관리하는 최상위 래퍼입니다." },
      { name: "ComboboxInput", role: "검색어를 입력하고 드롭다운을 여닫는 입력 칸입니다." },
      { name: "ComboboxContent", role: "필터링된 후보 목록을 띄우는 팝업 컨테이너입니다." },
      { name: "ComboboxList", role: "후보 항목들을 렌더링하는 목록 영역입니다." },
      { name: "ComboboxItem", role: "클릭이나 Enter로 선택하는 개별 후보 항목입니다." },
      {
        name: "ComboboxEmpty",
        role: "검색 결과가 없을 때 표시하는 [[empty-state|빈 상태]] 문구입니다.",
      },
    ],
    accessibility: {
      keys: [
        { keys: "ArrowUp / ArrowDown", action: "후보 목록에서 이전·다음 항목을 강조합니다." },
        { keys: "Enter", action: "강조된 후보 항목을 선택합니다." },
        { keys: "Esc", action: "후보 목록 팝업을 닫습니다." },
      ],
      notes: [
        "ComboboxInput에 label이나 aria-label을 연결해 무엇을 검색·선택하는지 알립니다.",
        "일치하는 항목이 없을 때 ComboboxEmpty로 명확한 안내를 보여 줍니다.",
      ],
    },
    related: [
      {
        slug: "select",
        reason: "후보가 적어 검색 없이 목록에서 바로 고를 수 있을 때 씁니다.",
      },
      {
        slug: "autocomplete",
        reason: "목록에 없는 자유 문자열도 그대로 입력값으로 허용해야 할 때 씁니다.",
      },
    ],
  },

  autocomplete: {
    usage:
      "검색어나 주소처럼 자유롭게 텍스트를 입력하되 추천 후보를 함께 제시해 입력을 도울 때 씁니다. 추천 목록에서 고를 수도 있고 목록에 없는 값을 그대로 확정할 수도 있습니다.",
    anatomy: [
      { name: "Autocomplete", role: "입력값과 추천 목록 열림 상태를 관리하는 최상위 래퍼입니다." },
      { name: "AutocompleteInput", role: "사용자가 자유 텍스트를 입력하는 입력 칸입니다." },
      { name: "AutocompleteContent", role: "추천 후보를 띄우는 팝업 컨테이너입니다." },
      { name: "AutocompleteList", role: "추천 항목들을 나열하는 목록 영역입니다." },
      { name: "AutocompleteItem", role: "선택 시 입력 칸에 채워지는 개별 추천 항목입니다." },
      { name: "AutocompleteEmpty", role: "일치하는 추천이 없을 때 표시하는 안내 영역입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "ArrowUp / ArrowDown", action: "추천 목록에서 이전·다음 항목을 강조합니다." },
        { keys: "Enter", action: "강조된 추천 항목을 입력 칸에 채웁니다." },
        { keys: "Esc", action: "추천 목록 팝업을 닫습니다." },
      ],
      notes: [
        "AutocompleteInput에 label이나 aria-label로 [[accessible-name|접근 가능한 이름]]을 제공합니다.",
        "모바일에서는 가상 키보드가 화면을 가리지 않도록 추천 개수를 적절히 제한합니다.",
      ],
    },
    related: [
      {
        slug: "combobox",
        reason: "정해진 후보 목록 안의 값만 선택하도록 제한해야 할 때 씁니다.",
      },
      {
        slug: "input",
        reason: "추천 목록 없이 단순 텍스트만 입력받을 때 씁니다.",
      },
    ],
  },

  "otp-field": {
    usage:
      "이메일·문자 인증번호나 2단계 보안 코드처럼 자릿수가 고정된 코드를 칸마다 나누어 입력받을 때 씁니다. 한 자리씩 입력하면 자동으로 다음 칸으로 넘어가며 붙여넣기도 칸에 맞춰 분배합니다.",
    anatomy: [
      {
        name: "OTPField",
        role: "전체 코드 값, 칸 간 이동, 붙여넣기 분배를 관리하는 최상위 컨테이너입니다.",
      },
      { name: "OTPFieldInput", role: "코드 한 자리를 입력받는 개별 칸입니다." },
      {
        name: "OTPFieldSeparator",
        role: "코드 자릿수 묶음 사이를 시각적으로 나누는 구분 기호입니다.",
      },
    ],
    accessibility: {
      keys: [
        {
          keys: "ArrowLeft / ArrowRight",
          action: "이전·다음 자리 입력 칸으로 [[focus|포커스]]를 이동합니다.",
        },
        { keys: "Backspace", action: "현재 칸을 지우고 이전 칸으로 이동합니다." },
      ],
      notes: [
        '숫자 코드라면 inputMode="numeric"과 autoComplete="one-time-code"를 지정해 모바일 숫자 키패드와 자동 완성을 지원합니다.',
        "전체 필드에 aria-label이나 주변 제목을 연결해 몇 자리 인증 코드인지 알립니다.",
      ],
    },
    related: [
      {
        slug: "input",
        reason: "자릿수가 고정되지 않은 일반 텍스트나 비밀번호는 Input을 씁니다.",
      },
    ],
  },

  "scroll-area": {
    usage:
      "사이드바, 코드 블록, 고정 높이 목록처럼 제한된 영역 안에서 OS마다 다른 스크롤바 모양을 일관되게 맞출 때 씁니다. 가로·세로 방향의 커스텀 스크롤바를 제공합니다.",
    accessibility: {
      keys: [],
      notes: [
        "페이지 전체 본문은 모바일 관성 스크롤을 살리기 위해 네이티브 스크롤을 우선 쓰고, 부분 패널에만 ScrollArea를 적용합니다.",
        "키보드 사용자가 스크롤 영역에 접근할 수 있도록 내부 콘텐츠의 [[focus|포커스]] 흐름을 막지 않습니다.",
      ],
    },
    related: [
      {
        slug: "table",
        reason: "구조화된 행·열 데이터의 가로 스크롤은 Table을 씁니다.",
      },
      {
        slug: "drawer",
        reason: "긴 탐색이나 필터 목록을 별도 측면 패널로 열 때 씁니다.",
      },
    ],
  },

  "context-menu": {
    usage:
      "파일 목록, 캔버스, 표 행처럼 특정 대상 위에서 마우스 우클릭으로 관련 동작 목록을 열 때 씁니다. 화면에 버튼을 노출하지 않고도 대상별 빠른 편집 동작을 제공합니다.",
    anatomy: [
      {
        name: "ContextMenu",
        role: "우클릭 메뉴의 열림 상태와 포인터 좌표를 관리하는 최상위 래퍼입니다.",
      },
      { name: "ContextMenuTrigger", role: "우클릭 이벤트를 받아 메뉴를 여는 대상 영역입니다." },
      { name: "ContextMenuContent", role: "포인터 위치에 맞춰 띄워지는 메뉴 패널입니다." },
      { name: "ContextMenuItem", role: "클릭이나 Enter로 동작을 실행하는 개별 항목입니다." },
      { name: "ContextMenuSeparator", role: "동작 묶음이나 위험 동작을 구분하는 선입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "ArrowUp / ArrowDown", action: "메뉴 안의 이전·다음 항목으로 이동합니다." },
        { keys: "Enter", action: "강조된 항목을 실행합니다." },
        { keys: "Esc", action: "메뉴를 닫습니다." },
      ],
      notes: [
        "터치 기기에는 우클릭이 없으므로 중요한 동작은 [[menu|Menu]] 버튼이나 [[bottom-sheet|Bottom Sheet]]로도 함께 제공합니다.",
        "삭제 같은 위험 동작은 ContextMenuSeparator 아래에 두고 [[destructive|Destructive]] 스타일로 구분합니다.",
      ],
    },
    related: [
      {
        slug: "menu",
        reason: "우클릭 대신 눈에 보이는 더보기 버튼으로 동작 목록을 열 때 씁니다.",
      },
      {
        slug: "popover",
        reason: "동작 목록이 아니라 설정 폼이나 보조 정보를 띄울 때 씁니다.",
      },
    ],
  },

  "preview-card": {
    usage:
      "사용자 이름이나 문서 링크에 마우스를 올렸을 때 페이지를 이동하지 않고 요약 정보를 미리 보여 주는 [[non-modal|비모달]] 카드입니다. 본문 흐름을 끊지 않고 대상의 맥락을 확인할 때 씁니다.",
    anatomy: [
      {
        name: "PreviewCard",
        role: "미리보기 카드의 열림 지연과 상태를 관리하는 최상위 래퍼입니다.",
      },
      {
        name: "PreviewCardTrigger",
        role: "[[hover|호버]]나 [[focus|포커스]]를 받아 카드를 여는 링크·트리거 요소입니다.",
      },
      { name: "PreviewCardContent", role: "요약 프로필이나 문서 미리보기를 담는 팝업 카드입니다." },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "트리거에 [[focus|포커스]]를 옮겨 미리보기 카드를 엽니다." },
        { keys: "Esc", action: "열려 있는 미리보기 카드를 닫습니다." },
      ],
      notes: [
        "터치 환경에는 [[hover|호버]]가 없으므로 핵심 동작이나 필수 정보는 카드 안에만 두지 않고 링크 대상 페이지에서 제공합니다.",
        "트리거는 클릭 시 원래 대상 페이지로 이동하는 정상적인 링크로 유지합니다.",
      ],
    },
    related: [
      {
        slug: "tooltip",
        reason: "요약 카드가 아니라 한 줄짜리 짧은 설명만 띄울 때 씁니다.",
      },
      {
        slug: "popover",
        reason: "[[hover|호버]]가 아니라 클릭으로 열고 닫으며 내부에서 조작해야 할 때 씁니다.",
      },
    ],
  },

  menubar: {
    usage:
      "파일, 편집, 보기처럼 데스크톱 앱 스타일의 상위 명령 메뉴들을 가로 한 줄에 나란히 배치할 때 씁니다. 한 메뉴가 열린 상태에서 포인터 이동이나 화살표 키로 옆 메뉴를 자연스럽게 넘나듭니다.",
    accessibility: {
      keys: [
        { keys: "ArrowLeft / ArrowRight", action: "메뉴바의 이전·다음 상위 메뉴로 이동합니다." },
        { keys: "ArrowUp / ArrowDown", action: "열린 메뉴 안의 이전·다음 항목으로 이동합니다." },
        { keys: "Enter / Space", action: "메뉴를 열거나 강조된 항목을 실행합니다." },
        { keys: "Esc", action: "열린 메뉴를 닫고 메뉴바 트리거로 [[focus|포커스]]를 되돌립니다." },
      ],
      notes: [
        "메뉴바는 페이지 이동용 전역 헤더가 아니라 문서 편집기 같은 앱 명령 모음에 씁니다.",
        "좁은 화면에서는 가로 공간이 부족하므로 [[drawer|Drawer]]나 단일 [[menu|Menu]]로 전환합니다.",
      ],
    },
    related: [
      {
        slug: "navigation-menu",
        reason:
          "앱 명령이 아니라 사이트 페이지 간 이동을 위한 전역 탐색은 Navigation Menu를 씁니다.",
      },
      {
        slug: "menu",
        reason: "단일 버튼 하나로 동작 목록을 열 때 씁니다.",
      },
    ],
  },

  "navigation-menu": {
    usage:
      "상단 헤더에서 여러 페이지 링크와 하위 카테고리 패널을 묶어 제공하는 사이트 전역 탐색에 씁니다. 링크 수가 많고 하위 설명이나 묶음을 펼쳐 보여 주어야 할 때 적합합니다.",
    anatomy: [
      {
        name: "NavigationMenu",
        role: "전역 탐색의 열림 상태와 패널 전환을 관리하는 최상위 nav 컨테이너입니다.",
      },
      { name: "NavigationMenuList", role: "상위 탐색 항목들을 가로로 나열하는 목록입니다." },
      { name: "NavigationMenuItem", role: "개별 링크나 드롭다운 항목 하나를 감싸는 단위입니다." },
      { name: "NavigationMenuTrigger", role: "하위 탐색 패널을 여는 상위 메뉴 버튼입니다." },
      {
        name: "NavigationMenuContent",
        role: "하위 링크와 설명을 배치하는 드롭다운 패널 내용입니다.",
      },
      { name: "NavigationMenuLink", role: "실제 페이지로 이동하는 개별 탐색 링크입니다." },
      {
        name: "NavigationMenuViewport",
        role: "열린 패널을 부드러운 위치와 크기로 표시하는 뷰포트 영역입니다.",
      },
    ],
    accessibility: {
      keys: [
        { keys: "Tab", action: "탐색 트리거와 링크 사이로 [[focus|포커스]]를 이동합니다." },
        { keys: "Enter / Space", action: "하위 패널을 열거나 선택된 링크로 이동합니다." },
        { keys: "Esc", action: "열려 있는 하위 탐색 패널을 닫습니다." },
      ],
      notes: [
        "NavigationMenu에 aria-label로 '주요 탐색' 같은 이름을 붙여 다른 nav 영역과 구분합니다.",
        '현재 페이지에 해당하는 링크에는 aria-current="page"를 표시하고, 모바일 헤더에서는 [[drawer|Drawer]] 내부 목록으로 전환합니다.',
      ],
    },
    related: [
      {
        slug: "menubar",
        reason: "페이지 이동이 아니라 파일·편집 같은 앱 명령 모음은 Menubar를 씁니다.",
      },
      {
        slug: "tabs",
        reason: "다른 페이지로 이동하지 않고 같은 화면 안의 뷰만 바꿀 때 씁니다.",
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
