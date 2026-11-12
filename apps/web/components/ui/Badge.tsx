import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Same visual shape as components/cms/StatusBadge.tsx's inline styling
// (inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px]
// font-medium tracking-wide), generalized into a variant-driven primitive.
// StatusBadge itself is left untouched — it's a CMS component, out of
// scope for this task.
//
// Size/weight reference the canonical "Status badges" typography spec
// (11px/600/16px) via the --acos-type-*/--acos-weight-* tokens rather
// than Tailwind's own text-xs/font-medium, which are a different scale.
const badgeVariants = cva(
  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[length:var(--acos-type-xs)] font-[number:var(--acos-weight-semibold)] leading-[16px] tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border bg-transparent text-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
