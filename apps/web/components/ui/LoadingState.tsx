import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  label?: string;
  compact?: boolean;
  className?: string;
}

// role="status" + aria-live="polite" — announced to assistive tech
// without interrupting, per the brief's "accessible loading states".
export function LoadingState({ label = 'Loading…', compact = false, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center text-muted-foreground',
        compact ? 'py-6' : 'flex-1 py-20',
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
