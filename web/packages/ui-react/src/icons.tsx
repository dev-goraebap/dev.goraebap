import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Code2,
  Component,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Grid2x2,
  Info,
  Layers,
  LayoutGrid,
  LoaderCircle,
  Monitor,
  Moon,
  OctagonX,
  Palette,
  PanelLeft,
  Rocket,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Smartphone,
  Sparkles,
  Sun,
  SwatchBook,
  Type,
  TriangleAlert,
  X,
} from "lucide-react";

export type IconSetId = "solar" | "lucide";

export type SystemIconName =
  | "arrowRight"
  | "book"
  | "close"
  | "check"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "chevronUp"
  | "code"
  | "components"
  | "copy"
  | "desktop"
  | "details"
  | "error"
  | "externalLink"
  | "eye"
  | "file"
  | "font"
  | "info"
  | "layouts"
  | "loading"
  | "moon"
  | "mobile"
  | "overview"
  | "palette"
  | "reset"
  | "rocket"
  | "route"
  | "scroll"
  | "search"
  | "sun"
  | "success"
  | "swatch"
  | "transition"
  | "warning"
  | "workspace";

const IconSetContext = createContext<IconSetId>("solar");
export type IconOverrides = Partial<
  Record<SystemIconName, ComponentType<SvgProps>>
>;
const IconOverridesContext = createContext<IconOverrides | undefined>(
  undefined,
);

export function IconProvider({
  value,
  overrides,
  children,
}: {
  value: IconSetId;
  overrides?: IconOverrides;
  children: ReactNode;
}) {
  return (
    <IconSetContext.Provider value={value}>
      <IconOverridesContext.Provider value={overrides}>
        {children}
      </IconOverridesContext.Provider>
    </IconSetContext.Provider>
  );
}

export function useIconSet(): IconSetId {
  return useContext(IconSetContext);
}

type SvgProps = SVGProps<SVGSVGElement>;

function SolarSvg({ children, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const SOLAR_ICONS: Record<SystemIconName, (props: SvgProps) => ReactNode> = {
  chevronUp: (props) => (
    <SolarSvg {...props}>
      <path d="m6 15 6-6 6 6" />
    </SolarSvg>
  ),
  error: (props) => (
    <SolarSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </SolarSvg>
  ),
  info: (props) => (
    <SolarSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </SolarSvg>
  ),
  loading: (props) => (
    <SolarSvg {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </SolarSvg>
  ),
  success: (props) => (
    <SolarSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.75 2.75L16 9.5" />
    </SolarSvg>
  ),
  warning: (props) => (
    <SolarSvg {...props}>
      <path d="M10.3 4.8a2 2 0 0 1 3.4 0l7.3 12.7a2 2 0 0 1-1.7 3H4.7a2 2 0 0 1-1.7-3Z M12 9v4m0 3h.01" />
    </SolarSvg>
  ),
  arrowRight: (props) => (
    <SolarSvg {...props}>
      <path d="M5 12h14" opacity={0.65} />
      <path d="m13 6 6 6-6 6" />
    </SolarSvg>
  ),
  book: (props) => (
    <SolarSvg {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
      <path
        d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2V5.5Z"
        opacity={0.55}
      />
    </SolarSvg>
  ),
  close: (props) => (
    <SolarSvg {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </SolarSvg>
  ),
  check: (props) => (
    <SolarSvg strokeWidth={2.2} {...props}>
      <path d="M4.5 12.75 9.5 17.5 19.5 6.5" />
    </SolarSvg>
  ),
  chevronDown: (props) => (
    <SolarSvg {...props}>
      <path d="m19 9-7 6-7-6" />
    </SolarSvg>
  ),
  chevronLeft: (props) => (
    <SolarSvg {...props}>
      <path d="m15 5-6 7 6 7" />
    </SolarSvg>
  ),
  chevronRight: (props) => (
    <SolarSvg {...props}>
      <path d="m9 5 6 7-6 7" />
    </SolarSvg>
  ),
  code: (props) => (
    <SolarSvg {...props}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" opacity={0.55} />
    </SolarSvg>
  ),
  components: (props) => (
    <SolarSvg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" opacity={0.45} />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" opacity={0.45} />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </SolarSvg>
  ),
  copy: (props) => (
    <SolarSvg {...props}>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        opacity={0.55}
      />
    </SolarSvg>
  ),
  desktop: (props) => (
    <SolarSvg {...props}>
      <rect x="3" y="4" width="18" height="12.5" rx="2.5" />
      <path d="M8.5 20h7M12 16.5V20" opacity={0.55} />
    </SolarSvg>
  ),
  details: (props) => (
    <SolarSvg {...props}>
      <path d="M12 3 14.3 9.7 21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
      <circle cx="18.5" cy="5.5" r="1.2" opacity={0.5} />
    </SolarSvg>
  ),
  externalLink: (props) => (
    <SolarSvg {...props}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path
        d="M19 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5"
        opacity={0.55}
      />
    </SolarSvg>
  ),
  eye: (props) => (
    <SolarSvg {...props}>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        opacity={0.65}
      />
      <circle cx="12" cy="12" r="3" />
    </SolarSvg>
  ),
  file: (props) => (
    <SolarSvg {...props}>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M9 8.5h6M9 12.5h6M9 16.5h4" opacity={0.55} />
    </SolarSvg>
  ),
  font: (props) => (
    <SolarSvg {...props}>
      <path d="M5 6V4.5h14V6" />
      <path d="M12 4.5v15" />
      <path d="M9 19.5h6" opacity={0.55} />
    </SolarSvg>
  ),
  layouts: (props) => (
    <SolarSvg {...props}>
      <rect x="3" y="3.5" width="18" height="17" rx="3" />
      <path d="M9.5 3.5v17" opacity={0.55} />
      <path d="M9.5 10.5H21" opacity={0.55} />
    </SolarSvg>
  ),
  moon: (props) => (
    <SolarSvg {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </SolarSvg>
  ),
  mobile: (props) => (
    <SolarSvg {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 18h3" opacity={0.55} />
    </SolarSvg>
  ),
  overview: (props) => (
    <SolarSvg {...props}>
      <circle cx="7.5" cy="7.5" r="3" />
      <circle cx="16.5" cy="7.5" r="3" opacity={0.45} />
      <circle cx="7.5" cy="16.5" r="3" opacity={0.45} />
      <circle cx="16.5" cy="16.5" r="3" />
    </SolarSvg>
  ),
  palette: (props) => (
    <SolarSvg {...props}>
      <path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a1.5 1.5 0 0 1 0-3h3a5 5 0 0 0 5-5 5 5 0 0 0-9-5Z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </SolarSvg>
  ),
  reset: (props) => (
    <SolarSvg {...props}>
      <path d="M4 12a8 8 0 1 0 2.34-5.66L4 8.5" />
      <path d="M4 4.5v4h4" />
    </SolarSvg>
  ),
  rocket: (props) => (
    <SolarSvg {...props}>
      <path d="M14.5 9.5 19 5c1 3.5-1 7.5-4.5 10.5L11 19l-1-4-4-1 3.5-3.5C12.5 7 16.5 5 19 5" />
      <circle cx="14" cy="10" r="1.2" opacity={0.55} />
    </SolarSvg>
  ),
  route: (props) => (
    <SolarSvg {...props}>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H13a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h4.5" opacity={0.6} />
    </SolarSvg>
  ),
  scroll: (props) => (
    <SolarSvg {...props}>
      <rect x="6.5" y="3" width="11" height="18" rx="5.5" />
      <path d="M12 7.5v3.5" />
    </SolarSvg>
  ),
  search: (props) => (
    <SolarSvg {...props}>
      <circle cx="11.5" cy="11.5" r="8" />
      <path d="M18.5 18.5 21.5 21.5" />
    </SolarSvg>
  ),
  sun: (props) => (
    <SolarSvg {...props}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41M6.34 6.34 4.93 4.93" />
    </SolarSvg>
  ),
  swatch: (props) => (
    <SolarSvg {...props}>
      <rect x="4" y="4" width="6.5" height="16" rx="2" />
      <path d="M10.5 7.5 17 5l2.5 6-9 4" opacity={0.55} />
      <path d="M10.5 14h9.5v4a2 2 0 0 1-2 2H10.5" opacity={0.35} />
    </SolarSvg>
  ),
  transition: (props) => (
    <SolarSvg {...props}>
      <rect x="3.5" y="5" width="11" height="14" rx="2.5" opacity={0.45} />
      <rect x="9.5" y="5" width="11" height="14" rx="2.5" />
    </SolarSvg>
  ),
  workspace: (props) => (
    <SolarSvg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16" opacity={0.55} />
    </SolarSvg>
  ),
};

const LUCIDE_ICONS: Record<SystemIconName, (props: SvgProps) => ReactNode> = {
  chevronUp: (props) => <ChevronUp aria-hidden="true" {...props} />,
  error: (props) => <OctagonX aria-hidden="true" {...props} />,
  info: (props) => <Info aria-hidden="true" {...props} />,
  loading: (props) => <LoaderCircle aria-hidden="true" {...props} />,
  success: (props) => <CircleCheck aria-hidden="true" {...props} />,
  warning: (props) => <TriangleAlert aria-hidden="true" {...props} />,
  arrowRight: (props) => <ArrowRight aria-hidden="true" {...props} />,
  book: (props) => <BookOpen aria-hidden="true" {...props} />,
  close: (props) => <X aria-hidden="true" {...props} />,
  check: (props) => <Check aria-hidden="true" {...props} />,
  chevronDown: (props) => <ChevronDown aria-hidden="true" {...props} />,
  chevronLeft: (props) => <ChevronLeft aria-hidden="true" {...props} />,
  chevronRight: (props) => <ChevronRight aria-hidden="true" {...props} />,
  code: (props) => <Code2 aria-hidden="true" {...props} />,
  components: (props) => <Component aria-hidden="true" {...props} />,
  copy: (props) => <Copy aria-hidden="true" {...props} />,
  desktop: (props) => <Monitor aria-hidden="true" {...props} />,
  details: (props) => <Sparkles aria-hidden="true" {...props} />,
  externalLink: (props) => <ExternalLink aria-hidden="true" {...props} />,
  eye: (props) => <Eye aria-hidden="true" {...props} />,
  file: (props) => <FileText aria-hidden="true" {...props} />,
  font: (props) => <Type aria-hidden="true" {...props} />,
  layouts: (props) => <LayoutGrid aria-hidden="true" {...props} />,
  moon: (props) => <Moon aria-hidden="true" {...props} />,
  mobile: (props) => <Smartphone aria-hidden="true" {...props} />,
  overview: (props) => <Grid2x2 aria-hidden="true" {...props} />,
  palette: (props) => <Palette aria-hidden="true" {...props} />,
  reset: (props) => <RotateCcw aria-hidden="true" {...props} />,
  rocket: (props) => <Rocket aria-hidden="true" {...props} />,
  route: (props) => <RouteIcon aria-hidden="true" {...props} />,
  scroll: (props) => <ArrowUpDown aria-hidden="true" {...props} />,
  search: (props) => <Search aria-hidden="true" {...props} />,
  sun: (props) => <Sun aria-hidden="true" {...props} />,
  swatch: (props) => <SwatchBook aria-hidden="true" {...props} />,
  transition: (props) => <Layers aria-hidden="true" {...props} />,
  workspace: (props) => <PanelLeft aria-hidden="true" {...props} />,
};

export function SystemIcon({
  name,
  iconSet,
  ...props
}: SvgProps & { name: SystemIconName; iconSet?: IconSetId }) {
  const ctxSet = useIconSet();
  const overrides = useContext(IconOverridesContext);
  const Override = iconSet ? undefined : overrides?.[name];
  if (Override) return <Override aria-hidden="true" {...props} />;
  const active = iconSet ?? ctxSet;
  const render = active === "lucide" ? LUCIDE_ICONS[name] : SOLAR_ICONS[name];
  return <>{render(props)}</>;
}
