import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // `text-*-foreground!` (Tailwind's important modifier) is required
        // here, not just stylistic: app/globals.css's legacy, UNLAYERED
        // `:where(a) { color: var(--brand); }` rule (loaded globally by
        // the root layout for every route) outranks any `@layer utilities`
        // rule by CSS Cascade Layers semantics regardless of specificity —
        // so a plain `text-primary-foreground` silently loses to it
        // whenever these variants are applied to a <Link>/<a> instead of
        // a real <button>, as JourneyCard's CTA does. `!important` is the
        // one thing that still wins against an unlayered rule.
        primary: 'bg-primary text-primary-foreground! hover:opacity-90',
        secondary: 'bg-secondary text-secondary-foreground! hover:opacity-90',
        // Plus (Learn stage) accent — see tailwind-foundation.css's
        // --plus/--plus-foreground tokens. Pro and Max reuse
        // primary/secondary above rather than adding their own variants.
        plus: 'bg-plus text-plus-foreground! hover:opacity-90',
        outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// `type="button"` by default — the roadmap components already rely on this
// same opt-out-of-submit pattern (see ProductRoadmap.tsx) rather than Slot/
// asChild, which would need @radix-ui/react-slot, not currently a dependency.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
