import { ReactNode } from "react";

interface PageTemplateProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageTemplate({ title, description, actions, children }: PageTemplateProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{title}</h1>
          {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </div>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
