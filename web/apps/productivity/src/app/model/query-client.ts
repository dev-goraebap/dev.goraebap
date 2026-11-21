import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';

/** The app's one query client: data fresh for 30s; a failed read retried once, unless the server refused it (4xx). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => count < 1 && (!(error instanceof ApiError) || error.status >= 500),
    },
    mutations: { retry: false },
  },
});
