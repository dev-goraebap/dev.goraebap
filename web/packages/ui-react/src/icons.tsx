import { createContext, useContext, type ReactNode, type SVGProps } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Moon,
  RotateCcw,
  Search,
  Sun,
  X,
} from "lucide-react";

export type IconSetId = "solar" | "lucide";

export type SystemIconName =
  | "close"
  | "check"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "copy"
  | "moon"
  | "reset"
  | "search"
  | "sun";

const IconSetContext = createContext<IconSetId>("solar");

export function IconProvider({ value, children }: { value: IconSetId; children: ReactNode }) {
  return <IconSetContext.Provider value={value}>{children}</IconSetContext.Provider>;
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
  close: (props) => (
    <SolarSvg {...props}>
      <circle cx="12" cy="12" r="9.5" opacity={0.28} />
      <path d="M14.5 9.5 9.5 14.5M9.5 9.5l5 5" />
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
  copy: (props) => (
    <SolarSvg {...props}>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" opacity={0.55} />
    </SolarSvg>
  ),
  moon: (props) => (
    <SolarSvg {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </SolarSvg>
  ),
  reset: (props) => (
    <SolarSvg {...props}>
      <path d="M4 12a8 8 0 1 0 2.34-5.66L4 8.5" />
      <path d="M4 4.5v4h4" />
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
};

const LUCIDE_ICONS: Record<SystemIconName, (props: SvgProps) => ReactNode> = {
  close: (props) => <X aria-hidden="true" {...props} />,
  check: (props) => <Check aria-hidden="true" {...props} />,
  chevronDown: (props) => <ChevronDown aria-hidden="true" {...props} />,
  chevronLeft: (props) => <ChevronLeft aria-hidden="true" {...props} />,
  chevronRight: (props) => <ChevronRight aria-hidden="true" {...props} />,
  copy: (props) => <Copy aria-hidden="true" {...props} />,
  moon: (props) => <Moon aria-hidden="true" {...props} />,
  reset: (props) => <RotateCcw aria-hidden="true" {...props} />,
  search: (props) => <Search aria-hidden="true" {...props} />,
  sun: (props) => <Sun aria-hidden="true" {...props} />,
};

export function SystemIcon({
  name,
  iconSet,
  ...props
}: SvgProps & { name: SystemIconName; iconSet?: IconSetId }) {
  const ctxSet = useIconSet();
  const active = iconSet ?? ctxSet;
  const render = active === "lucide" ? LUCIDE_ICONS[name] : SOLAR_ICONS[name];
  return <>{render(props)}</>;
}
