/**
 * FrameworkFilter — standard Select dropdown backed by /api/org/frameworks.
 * Sourced from live org frameworks (not hardcoded). React Query cached.
 *
 * Usage:
 *   const [selected, setSelected] = useState<string[]>([]);
 *   <FrameworkFilter selected={selected} onChange={setSelected} />
 */

import { useQuery } from "@tanstack/react-query";
import { frameworksService } from "@/services/api/frameworks";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface FrameworkFilterProps {
  selected: string[];
  onChange: (slugs: string[]) => void;
  className?: string;
}

const EMPTY_VALUE = '__all_frameworks__';

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
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (orgFrameworks.length === 0) return null;

  const currentValue = selected.length === 1 ? selected[0] : EMPTY_VALUE;

  return (
    <Select
      value={currentValue}
      onValueChange={(value) => onChange(value === EMPTY_VALUE ? [] : [value])}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>All frameworks</SelectItem>
        {orgFrameworks.map((fw) => (
          <SelectItem key={fw.frameworkSlug} value={fw.frameworkSlug}>
            {fw.frameworkName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
