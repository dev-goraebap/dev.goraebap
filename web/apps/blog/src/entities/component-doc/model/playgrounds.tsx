import type { ComponentProps, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@goraebap/ui-react/components/alert";
import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { Card, CardDescription, CardTitle } from "@goraebap/ui-react/components/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@goraebap/ui-react/components/context-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@goraebap/ui-react/components/drawer";
import { Input } from "@goraebap/ui-react/components/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@goraebap/ui-react/components/menu";
import { Progress } from "@goraebap/ui-react/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@goraebap/ui-react/components/select";
import { Separator } from "@goraebap/ui-react/components/separator";
import { Skeleton } from "@goraebap/ui-react/components/skeleton";
import { Slider } from "@goraebap/ui-react/components/slider";
import { Switch } from "@goraebap/ui-react/components/switch";
import { Textarea } from "@goraebap/ui-react/components/textarea";
import { Toggle } from "@goraebap/ui-react/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { ToastPreview } from "../ui/PlaygroundPreviews";

export type PlaygroundFlag = "disabled" | "readOnly" | "loading" | "fullWidth";

export interface PlaygroundState {
  selection: Record<string, string>;
  flags: Record<PlaygroundFlag, boolean>;
}

export interface PlaygroundConfig {
  flags: PlaygroundFlag[];
  // 입력창처럼 항상 부모 너비를 채우는 컴포넌트는 부모 컨테이너를 늘 함께 보여 준다.
  fillsContainer?: boolean;
  render: (state: PlaygroundState) => ReactNode;
  reactCode: (attributes: string, state: PlaygroundState) => string;
  angularCode: (recipeArguments: string, state: PlaygroundState) => string;
}

const reactImport = (names: string, file: string) =>
  `import { ${names} } from "@goraebap/ui-react/components/${file}";`;
const recipeImport = (names: string, file: string) =>
  `import { ${names} } from "@goraebap/design-system/recipes/${file}";`;

const ANGULAR_SPINNER = `<svg [class]="buttonSpinnerVariants()" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>`;

function fieldAngular(
  tag: "input" | "textarea",
  recipe: string,
  file: string,
  recipeArguments: string,
  { selection, flags }: PlaygroundState,
  placeholder: string,
  label: string,
) {
  const attributes = [
    `[class]="${recipe}(${recipeArguments})"`,
    `placeholder="${placeholder}"`,
    `aria-label="${label}"`,
    selection.invalid === "true" ? 'aria-invalid="true"' : "",
    flags.disabled ? "disabled" : "",
    flags.readOnly ? "readonly" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${recipeImport(recipe, file)}

${tag === "input" ? `<input ${attributes} />` : `<textarea ${attributes}></textarea>`}`;
}

// 레시피의 옵션 값은 문자열로 다루므로 각 컴포넌트의 prop 타입으로 넘길 때만 좁힌다.
const prop = <Value,>(value: string) => value as unknown as Value;

export const COMPONENT_PLAYGROUNDS: Partial<Record<string, PlaygroundConfig>> = {
  button: {
    flags: ["disabled", "loading", "fullWidth"],
    render: ({ selection, flags }) => {
      const shared = {
        variant: prop<ComponentProps<typeof Button>["variant"]>(selection.variant),
        size: prop<ComponentProps<typeof Button>["size"]>(selection.size),
        shape: prop<ComponentProps<typeof Button>["shape"]>(selection.shape),
        disabled: flags.disabled,
        loading: flags.loading,
        className: flags.fullWidth ? "w-full" : undefined,
      };
      return selection.size === "icon" ? (
        <Button {...shared} aria-label="저장">
          <SystemIcon name="check" />
        </Button>
      ) : (
        <Button {...shared}>{flags.loading ? "저장 중" : "저장"}</Button>
      );
    },
    reactCode: (attributes, { selection, flags }) =>
      selection.size === "icon"
        ? `${reactImport("Button", "button")}
import { SystemIcon } from "@goraebap/ui-react/icons";

<Button${attributes} aria-label="저장">
  <SystemIcon name="check" />
</Button>`
        : `${reactImport("Button", "button")}

<Button${attributes}>${flags.loading ? "저장 중" : "저장"}</Button>`,
    angularCode: (recipeArguments, { selection, flags }) => {
      const isIcon = selection.size === "icon";
      const imports = flags.loading ? "buttonSpinnerVariants, buttonVariants" : "buttonVariants";
      const attributes = [
        `[class]="buttonVariants(${recipeArguments})"`,
        flags.disabled || flags.loading ? "disabled" : "",
        flags.loading ? 'aria-busy="true"' : "",
        isIcon ? 'aria-label="저장"' : "",
      ]
        .filter(Boolean)
        .join(" ");
      const label = isIcon
        ? flags.loading
          ? ""
          : '<ng-icon name="check" />'
        : flags.loading
          ? "저장 중"
          : "저장";
      const body = flags.loading ? `\n  ${ANGULAR_SPINNER}${label ? `\n  ${label}` : ""}\n` : label;
      return `${recipeImport(imports, "button")}

<button ${attributes}>${body}</button>`;
    },
  },
  input: {
    flags: ["disabled", "readOnly"],
    fillsContainer: true,
    render: ({ selection, flags }) => (
      <Input
        size={prop<ComponentProps<typeof Input>["size"]>(selection.size)}
        invalid={selection.invalid === "true"}
        disabled={flags.disabled}
        readOnly={flags.readOnly}
        placeholder="name@goraebap.xyz"
        aria-label="이메일"
      />
    ),
    reactCode: (attributes) => `${reactImport("Input", "input")}

<Input${attributes} placeholder="name@goraebap.xyz" aria-label="이메일" />`,
    angularCode: (recipeArguments, state) =>
      fieldAngular(
        "input",
        "inputVariants",
        "input",
        recipeArguments,
        state,
        "name@goraebap.xyz",
        "이메일",
      ),
  },
  textarea: {
    flags: ["disabled", "readOnly"],
    fillsContainer: true,
    render: ({ selection, flags }) => (
      <Textarea
        invalid={selection.invalid === "true"}
        disabled={flags.disabled}
        readOnly={flags.readOnly}
        placeholder="내용을 입력합니다"
        aria-label="내용"
      />
    ),
    reactCode: (attributes) => `${reactImport("Textarea", "textarea")}

<Textarea${attributes} placeholder="내용을 입력합니다" aria-label="내용" />`,
    angularCode: (recipeArguments, state) =>
      fieldAngular(
        "textarea",
        "textareaVariants",
        "textarea",
        recipeArguments,
        state,
        "내용을 입력합니다",
        "내용",
      ),
  },
  switch: {
    flags: ["disabled"],
    render: ({ selection, flags }) => (
      <Switch
        shape={prop<ComponentProps<typeof Switch>["shape"]>(selection.shape)}
        disabled={flags.disabled}
        defaultChecked
        aria-label="알림"
      />
    ),
    reactCode: (attributes) => `${reactImport("Switch", "switch")}

<Switch${attributes} defaultChecked aria-label="알림" />`,
    angularCode: (recipeArguments, { flags }) => `${recipeImport(
      "switchThumbVariants, switchTrackVariants",
      "switch",
    )}

<brn-switch [class]="switchTrackVariants(${recipeArguments})"${flags.disabled ? " disabled" : ""} aria-label="알림">
  <brn-switch-thumb [class]="switchThumbVariants(${recipeArguments})" />
</brn-switch>`,
  },
  badge: {
    flags: [],
    render: ({ selection }) => (
      <Badge variant={prop<ComponentProps<typeof Badge>["variant"]>(selection.variant)}>
        새 기능
      </Badge>
    ),
    reactCode: (attributes) => `${reactImport("Badge", "badge")}

<Badge${attributes}>새 기능</Badge>`,
    angularCode: (recipeArguments) => `${recipeImport("badgeVariants", "badge")}

<span [class]="badgeVariants(${recipeArguments})">새 기능</span>`,
  },
  card: {
    flags: [],
    fillsContainer: true,
    render: ({ selection }) => (
      <Card
        padding={prop<ComponentProps<typeof Card>["padding"]>(selection.padding)}
        interactive={selection.interactive === "true"}
      >
        <CardTitle>프로젝트 현황</CardTitle>
        <CardDescription>이번 주 진행 상황을 확인합니다.</CardDescription>
      </Card>
    ),
    reactCode: (attributes) => `${reactImport("Card, CardDescription, CardTitle", "card")}

<Card${attributes}>
  <CardTitle>프로젝트 현황</CardTitle>
  <CardDescription>이번 주 진행 상황을 확인합니다.</CardDescription>
</Card>`,
    angularCode: (recipeArguments) => `${recipeImport("cardVariants", "card")}

<article [class]="cardVariants(${recipeArguments})">
  <h3 class="text-sm font-semibold tracking-tight">프로젝트 현황</h3>
  <p class="text-muted-foreground text-xs leading-relaxed">이번 주 진행 상황을 확인합니다.</p>
</article>`,
  },
  alert: {
    flags: [],
    fillsContainer: true,
    render: ({ selection }) => (
      <Alert role="note" variant={prop<ComponentProps<typeof Alert>["variant"]>(selection.variant)}>
        <AlertTitle>변경 사항을 저장했습니다</AlertTitle>
        <AlertDescription>다음 접속부터 새 설정이 적용됩니다.</AlertDescription>
      </Alert>
    ),
    reactCode: (attributes) => `${reactImport("Alert, AlertDescription, AlertTitle", "alert")}

<Alert${attributes}>
  <AlertTitle>변경 사항을 저장했습니다</AlertTitle>
  <AlertDescription>다음 접속부터 새 설정이 적용됩니다.</AlertDescription>
</Alert>`,
    angularCode: (recipeArguments) => `${recipeImport("alertVariants", "alert")}

<div role="alert" [class]="alertVariants(${recipeArguments})">
  <h5>변경 사항을 저장했습니다</h5>
  <p>다음 접속부터 새 설정이 적용됩니다.</p>
</div>`,
  },
  separator: {
    flags: [],
    render: ({ selection }) =>
      selection.orientation === "vertical" ? (
        <div className="flex h-10 items-center gap-4 text-sm">
          <span>문서</span>
          <Separator orientation="vertical" />
          <span>설정</span>
        </div>
      ) : (
        <div className="w-64 space-y-3 text-sm">
          <p>문서</p>
          <Separator />
          <p>설정</p>
        </div>
      ),
    reactCode: (attributes) => `${reactImport("Separator", "separator")}

<Separator${attributes} />`,
    angularCode: (recipeArguments) => `${recipeImport("separatorVariants", "separator")}

<brn-separator [class]="separatorVariants(${recipeArguments})" />`,
  },
  skeleton: {
    flags: [],
    render: ({ selection }) => (
      <Skeleton
        shape={prop<ComponentProps<typeof Skeleton>["shape"]>(selection.shape)}
        className={
          selection.shape === "circle"
            ? "size-14"
            : selection.shape === "line"
              ? "w-56"
              : "h-24 w-56"
        }
      />
    ),
    reactCode: (attributes, { selection }) => `${reactImport("Skeleton", "skeleton")}

<Skeleton${attributes} className="${
      selection.shape === "circle" ? "size-14" : selection.shape === "line" ? "w-56" : "h-24 w-56"
    }" />`,
    angularCode: (
      recipeArguments,
      { selection },
    ) => `${recipeImport("skeletonVariants", "skeleton")}

<div aria-hidden="true" [class]="skeletonVariants(${
      recipeArguments ? `${recipeArguments.slice(0, -2)}, className: '` : "{ className: '"
    }${
      selection.shape === "circle" ? "size-14" : selection.shape === "line" ? "w-56" : "h-24 w-56"
    }' })"></div>`,
  },
  toggle: {
    flags: ["disabled"],
    render: ({ selection, flags }) => (
      <Toggle
        variant={prop<ComponentProps<typeof Toggle>["variant"]>(selection.variant)}
        size={prop<ComponentProps<typeof Toggle>["size"]>(selection.size)}
        shape={prop<ComponentProps<typeof Toggle>["shape"]>(selection.shape)}
        disabled={flags.disabled}
        defaultPressed
      >
        고정
      </Toggle>
    ),
    reactCode: (attributes) => `${reactImport("Toggle", "toggle")}

<Toggle${attributes} defaultPressed>고정</Toggle>`,
    angularCode: (recipeArguments, { flags }) => `${recipeImport("toggleVariants", "toggle")}

<button brnToggle [class]="toggleVariants(${recipeArguments})"${flags.disabled ? " disabled" : ""}>고정</button>`,
  },
  "toggle-group": {
    flags: [],
    render: ({ selection }) => {
      const shape = prop<ComponentProps<typeof ToggleGroup>["shape"]>(selection.shape);
      return (
        <ToggleGroup shape={shape} defaultValue={["list"]} aria-label="보기 방식">
          <ToggleGroupItem value="list" shape={shape}>
            목록
          </ToggleGroupItem>
          <ToggleGroupItem value="board" shape={shape}>
            보드
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" shape={shape}>
            달력
          </ToggleGroupItem>
        </ToggleGroup>
      );
    },
    reactCode: (attributes) => `${reactImport("ToggleGroup, ToggleGroupItem", "toggle-group")}

<ToggleGroup${attributes} defaultValue={["list"]} aria-label="보기 방식">
  <ToggleGroupItem value="list"${attributes}>목록</ToggleGroupItem>
  <ToggleGroupItem value="board"${attributes}>보드</ToggleGroupItem>
  <ToggleGroupItem value="calendar"${attributes}>달력</ToggleGroupItem>
</ToggleGroup>`,
    angularCode: (recipeArguments) => `${recipeImport("toggleGroupVariants", "toggle-group")}
${recipeImport("toggleVariants", "toggle")}

<brn-toggle-group [class]="toggleGroupVariants(${recipeArguments})" aria-label="보기 방식">
  <button brnToggle value="list" [class]="toggleVariants(${recipeArguments})">목록</button>
  <button brnToggle value="board" [class]="toggleVariants(${recipeArguments})">보드</button>
  <button brnToggle value="calendar" [class]="toggleVariants(${recipeArguments})">달력</button>
</brn-toggle-group>`,
  },
  select: {
    flags: [],
    fillsContainer: true,
    render: ({ selection }) => (
      <Select defaultValue="목록 보기">
        <SelectTrigger
          size={prop<ComponentProps<typeof SelectTrigger>["size"]>(selection.size)}
          aria-label="보기"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="목록 보기">목록 보기</SelectItem>
          <SelectItem value="보드 보기">보드 보기</SelectItem>
          <SelectItem value="달력 보기">달력 보기</SelectItem>
        </SelectContent>
      </Select>
    ),
    reactCode: (
      attributes,
    ) => `${reactImport("Select, SelectContent, SelectItem, SelectTrigger, SelectValue", "select")}

<Select defaultValue="목록 보기">
  <SelectTrigger${attributes} aria-label="보기">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="목록 보기">목록 보기</SelectItem>
    <SelectItem value="보드 보기">보드 보기</SelectItem>
  </SelectContent>
</Select>`,
    angularCode: (recipeArguments) => `${recipeImport("selectTriggerVariants", "select")}

<brn-select placeholder="보기">
  <button brnSelectTrigger [class]="selectTriggerVariants(${recipeArguments})">...</button>
</brn-select>`,
  },
  menu: {
    flags: [],
    render: ({ selection }) => (
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>메뉴 열기</MenuTrigger>
        <MenuContent>
          <MenuItem>복제</MenuItem>
          <MenuItem variant={prop<ComponentProps<typeof MenuItem>["variant"]>(selection.variant)}>
            삭제
          </MenuItem>
        </MenuContent>
      </Menu>
    ),
    reactCode: (attributes) => `${reactImport("Menu, MenuContent, MenuItem, MenuTrigger", "menu")}

<Menu>
  <MenuTrigger render={<Button variant="outline" />}>메뉴 열기</MenuTrigger>
  <MenuContent>
    <MenuItem>복제</MenuItem>
    <MenuItem${attributes}>삭제</MenuItem>
  </MenuContent>
</Menu>`,
    angularCode: (
      recipeArguments,
    ) => `${recipeImport("menuItemVariants, menuPopupVariants", "menu")}

<button [brnMenuTriggerFor]="menu">메뉴 열기</button>
<ng-template #menu>
  <div brnMenu [class]="menuPopupVariants()">
    <button brnMenuItem [class]="menuItemVariants()">복제</button>
    <button brnMenuItem [class]="menuItemVariants(${recipeArguments})">삭제</button>
  </div>
</ng-template>`,
  },
  "context-menu": {
    flags: [],
    render: ({ selection }) => (
      <ContextMenu>
        <ContextMenuTrigger className="border-border text-muted-foreground flex h-28 w-64 items-center justify-center rounded-lg border border-dashed text-sm">
          이 영역을 우클릭합니다
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>복사</ContextMenuItem>
          <ContextMenuItem
            variant={prop<ComponentProps<typeof ContextMenuItem>["variant"]>(selection.variant)}
          >
            삭제
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
    reactCode: (attributes) => `${reactImport(
      "ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger",
      "context-menu",
    )}

<ContextMenu>
  <ContextMenuTrigger>이 영역을 우클릭합니다</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>복사</ContextMenuItem>
    <ContextMenuItem${attributes}>삭제</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    angularCode: (recipeArguments) => `${recipeImport(
      "contextMenuItemVariants, contextMenuPopupVariants",
      "context-menu",
    )}

<div [brnCtxMenuTriggerFor]="menu">이 영역을 우클릭합니다</div>
<ng-template #menu>
  <div brnMenu [class]="contextMenuPopupVariants()">
    <button brnMenuItem [class]="contextMenuItemVariants()">복사</button>
    <button brnMenuItem [class]="contextMenuItemVariants(${recipeArguments})">삭제</button>
  </div>
</ng-template>`,
  },
  slider: {
    flags: ["disabled"],
    fillsContainer: true,
    render: ({ selection, flags }) => (
      <Slider
        shape={prop<ComponentProps<typeof Slider>["shape"]>(selection.shape)}
        disabled={flags.disabled}
        defaultValue={60}
        aria-label="불투명도"
      />
    ),
    reactCode: (attributes) => `${reactImport("Slider", "slider")}

<Slider${attributes} defaultValue={60} aria-label="불투명도" />`,
    angularCode: (recipeArguments, { flags }) => `${recipeImport(
      "sliderIndicatorVariants, sliderThumbVariants, sliderTrackVariants",
      "slider",
    )}

<brn-slider${flags.disabled ? " disabled" : ""} [value]="60" aria-label="불투명도">
  <div brnSliderTrack [class]="sliderTrackVariants(${recipeArguments})">
    <div brnSliderRange [class]="sliderIndicatorVariants(${recipeArguments})"></div>
  </div>
  <span brnSliderThumb [class]="sliderThumbVariants(${recipeArguments})"></span>
</brn-slider>`,
  },
  avatar: {
    flags: [],
    render: ({ selection }) => (
      <Avatar
        size={prop<ComponentProps<typeof Avatar>["size"]>(selection.size)}
        shape={prop<ComponentProps<typeof Avatar>["shape"]>(selection.shape)}
      >
        <AvatarFallback>고래</AvatarFallback>
      </Avatar>
    ),
    reactCode: (attributes) => `${reactImport("Avatar, AvatarFallback", "avatar")}

<Avatar${attributes}>
  <AvatarFallback>고래</AvatarFallback>
</Avatar>`,
    angularCode: (recipeArguments) => `${recipeImport(
      "avatarFallbackVariants, avatarVariants",
      "avatar",
    )}

<span [class]="avatarVariants(${recipeArguments})">
  <span [class]="avatarFallbackVariants()">고래</span>
</span>`,
  },
  progress: {
    flags: [],
    fillsContainer: true,
    render: ({ selection }) => (
      <Progress
        shape={prop<ComponentProps<typeof Progress>["shape"]>(selection.shape)}
        value={68}
        aria-label="진행률"
      />
    ),
    reactCode: (attributes) => `${reactImport("Progress", "progress")}

<Progress${attributes} value={68} aria-label="진행률" />`,
    angularCode: (recipeArguments) => `${recipeImport(
      "progressIndicatorVariants, progressTrackVariants",
      "progress",
    )}

<brn-progress [value]="68" aria-label="진행률" [class]="progressTrackVariants(${recipeArguments})">
  <brn-progress-indicator [class]="progressIndicatorVariants(${recipeArguments})" />
</brn-progress>`,
  },
  drawer: {
    flags: [],
    render: ({ selection }) => {
      const side = prop<ComponentProps<typeof DrawerContent>["side"]>(selection.side);
      return (
        <Drawer key={side} swipeDirection={side === "left" ? "left" : "right"}>
          <DrawerTrigger render={<Button variant="outline" />}>드로어 열기</DrawerTrigger>
          <DrawerContent side={side}>
            <DrawerTitle>필터 설정</DrawerTitle>
            <DrawerDescription>화면 가장자리에서 보조 패널을 엽니다.</DrawerDescription>
            <div className="mt-5 flex justify-end">
              <DrawerClose render={<Button size="sm" />}>적용</DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      );
    },
    reactCode: (attributes, { selection }) => `${reactImport(
      "Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger",
      "drawer",
    )}

<Drawer swipeDirection="${selection.side}">
  <DrawerTrigger render={<Button variant="outline" />}>드로어 열기</DrawerTrigger>
  <DrawerContent${attributes}>
    <DrawerTitle>필터 설정</DrawerTitle>
    <DrawerDescription>화면 가장자리에서 보조 패널을 엽니다.</DrawerDescription>
  </DrawerContent>
</Drawer>`,
    angularCode: (
      recipeArguments,
      { selection },
    ) => `${recipeImport("drawerPopupVariants", "drawer")}

<brn-sheet side="${selection.side}">
  <button brnSheetTrigger>드로어 열기</button>
  <div *brnSheetContent [class]="drawerPopupVariants(${recipeArguments})">...</div>
</brn-sheet>`,
  },
  toast: {
    flags: [],
    render: ({ selection }) => <ToastPreview variant={selection.variant} />,
    reactCode: (_, { selection }) => `${reactImport("useToastManager", "toast")}

const toastManager = useToastManager();

toastManager.add({
  title: "설정이 저장되었습니다",
  description: "변경 사항이 즉시 반영됩니다.",${
    selection.variant === "default" ? "" : `\n  type: "${selection.variant}",`
  }
});`,
    angularCode: (recipeArguments) => `${recipeImport("toastRootVariants", "toast")}

<div role="status" [class]="toastRootVariants(${recipeArguments})">설정이 저장되었습니다</div>`,
  },
};
