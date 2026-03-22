import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';

interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

/**
 * Consistent layout wrapper for all detail pages (Risk, Framework, Test, Audit, etc.).
 *
 * Provides a back button, title + optional badge, optional subtitle, right-aligned
 * actions area, and a loading state with centered spinner.
 */
export function DetailPageLayout({
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
  badge,
  children,
  loading,
}: DetailPageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <PageTemplate title={title}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={handleBack}
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        {backLabel ?? 'Back'}
      </Button>

      {/* Header row: title + badge on left, actions on right */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {badge}
        </div>
        {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      {/* Loading or children */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
        </div>
      ) : (
        children
      )}
    </PageTemplate>
  );
}
