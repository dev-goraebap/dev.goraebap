import './secure-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { useAppearance } from '@/shared/lib/appearance';
import { Toaster } from '@/shared/ui/kit/toast';
import { TooltipProvider } from '@/shared/ui/kit/tooltip';
import { queryClient } from './model/query-client';
import { AppTheme } from './providers/AppTheme';
import { BootCover } from './BootCover';
import { createAppRouter } from './router/router';

const router = createAppRouter(queryClient);

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
    <TooltipProvider>
      <Toaster><RouterProvider router={router} /></Toaster>
    </TooltipProvider>
    <BootCover router={router} />
  </AppTheme>;
}

createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
