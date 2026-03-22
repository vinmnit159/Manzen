import { ReactNode } from "react";

interface PageTemplateProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sticky?: boolean;
}

export function PageTemplate({ title, description, actions, children, sticky }: PageTemplateProps) {
  return (
    <div className="p-4 sm:p-6">
      <div
        className={
          sticky
            ? "mb-4 sm:mb-6 sticky top-0 z-10 bg-card border-b border-border shadow-sm"
            : "mb-4 sm:mb-6"
        }
      >
        <div className="flex items-start sm:items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{title}</h1>
          {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
