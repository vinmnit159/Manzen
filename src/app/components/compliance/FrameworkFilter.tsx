/**
 * FrameworkFilter — multi-select filter bar backed by /api/org/frameworks.
 * Sourced from live org frameworks (not hardcoded). React Query cached.
 * Clicking a chip toggles it in/out of the active filter set.
 *
 * Usage:
 *   const [selected, setSelected] = useState<string[]>([]);
 *   <FrameworkFilter selected={selected} onChange={setSelected} />
 */

import { useQuery } from "@tanstack/react-query";
import { frameworksService } from "@/services/api/frameworks";
import { FrameworkTag } from "./FrameworkTag";
import { Loader2 } from "lucide-react";

interface FrameworkFilterProps {
  selected: string[];
  onChange: (slugs: string[]) => void;
  className?: string;
}

export function FrameworkFilter({ selected, onChange, className = '' }: FrameworkFilterProps) {
  const { data: res, isLoading } = useQuery({
    queryKey: ['frameworks', 'org'],
    queryFn: () => frameworksService.listOrgFrameworks(),
    staleTime: 60_000,
  });

  const orgFrameworks = res?.data ?? [];

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Loading frameworks…</span>
      </div>
    );
  }

  if (orgFrameworks.length === 0) return null;

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter(s => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs text-gray-400 font-medium shrink-0">Framework:</span>
      {orgFrameworks.map(fw => (
        <button
          key={fw.frameworkSlug}
          onClick={() => toggle(fw.frameworkSlug)}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all
            ${selected.includes(fw.frameworkSlug)
              ? 'ring-2 ring-offset-1 ring-blue-400'
              : 'opacity-70 hover:opacity-100'
            }`}
        >
          <FrameworkTag slug={fw.frameworkSlug} label={fw.frameworkName} size="xs" />
        </button>
      ))}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs text-gray-400 hover:text-gray-700 underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
