import './secure-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { IconProvider, type IconOverrides } from '@goraebap/ui-react/icons';
import { useAppearance } from '@/shared/lib/appearance';
import { Toaster } from '@goraebap/ui-react/compact/toast';
import { TooltipProvider } from '@goraebap/ui-react/compact/tooltip';
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CircleCheckIcon, InfoIcon,
  Loader2Icon, OctagonXIcon, SearchIcon, SquareArrowOutUpRightIcon, TriangleAlertIcon, XIcon } from '@/shared/ui/kit/icon';
import { queryClient } from './model/query-client';
import { AppTheme } from './providers/AppTheme';
import { BootCover } from './BootCover';
import { createAppRouter } from './router/router';

const router = createAppRouter(queryClient);
const icons = {
  check: CheckIcon, chevronDown: ChevronDownIcon, chevronLeft: ChevronLeftIcon, chevronRight: ChevronRightIcon, chevronUp: ChevronUpIcon,
  close: XIcon, error: OctagonXIcon, externalLink: SquareArrowOutUpRightIcon, info: InfoIcon,
  loading: Loader2Icon, search: SearchIcon, success: CircleCheckIcon, warning: TriangleAlertIcon,
} satisfies IconOverrides;

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

/** The app in the mode the member chose (화면 설정). */
function App() {
  const { mode } = useAppearance();
  // 인쇄용 화면(PDF 내보내기)은 화면 설정과 상관없이 밝은 테마로 그린다.
  const isPrint = window.location.pathname.startsWith('/print/');
  // 토스트(toast)와 툴팁은 앱 셸 밖(로그인 · 인쇄 화면, 목록 위 대화상자)에서도 뜨므로 뿌리에 둔다.
  return <AppTheme mode={isPrint ? 'light' : mode}>
    <IconProvider value="solar" overrides={icons}>
      <TooltipProvider>
        <Toaster><RouterProvider router={router} /></Toaster>
      </TooltipProvider>
    </IconProvider>
    <BootCover router={router} />
  </AppTheme>;
}

createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
