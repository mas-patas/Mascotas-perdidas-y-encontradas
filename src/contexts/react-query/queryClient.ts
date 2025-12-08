import { QueryClient } from '@tanstack/react-query';

// Create a client with retry strategy for robust loading
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: 1000,
    },
  },
});
