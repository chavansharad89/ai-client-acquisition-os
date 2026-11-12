import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** 0-100. Values outside that range are clamped. */
  value: number;
  label?: string;
  size?: 'sm' | 'default';
  className?: string;
}

// Plain div + ARIA role="progressbar", not @radix-ui/react-progress —
// that package isn't an existing dependency and a determinate bar is a
// small enough case not to justify adding one.
export function ProgressBar({ value, label, size = 'default', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const rounded = Math.round(clamped);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{rounded}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cn('w-full overflow-hidden rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2')}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}
