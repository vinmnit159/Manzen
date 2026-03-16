// ─── Shared types ─────────────────────────────────────────────────────────────

export type ToastFn = (type: 'success' | 'error', msg: string) => void;

export interface IntegrationCardProps {
  loadingStatus: boolean;
  onToast: ToastFn;
}
