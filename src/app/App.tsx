import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/app/routes";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from '@/app/components/ui/sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { ConfirmDialogProvider } from '@/app/hooks/useConfirmDialog';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfirmDialogProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" />
        </ConfirmDialogProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
