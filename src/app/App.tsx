import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/app/routes";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from '@/app/components/ui/sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
