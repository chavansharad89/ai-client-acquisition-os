import {
  Bot,
  BookOpen,
  ClipboardCheck,
  Compass,
  FlaskConical,
  GraduationCap,
  Hammer,
  LayoutDashboard,
  Library,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSoon {
  label: string;
  icon: LucideIcon;
  soon: true;
}

export type NavItem = NavLink | NavSoon;

export interface NavSection {
  heading?: string;
  headingIcon?: LucideIcon;
  /** When set, the section heading itself links here (e.g. "Learn — Plus"
   * → the Plus plan's own content), in addition to any real items inside
   * the section. Omitted for sections with no single plan destination
   * (Workspace, Account). */
  headingHref?: string;
  items: NavItem[];
}

// Approved ACOS navigation structure (revised). Real destinations:
// Dashboard (/home), My Library (/access), Pro Projects
// (/access/ai_freelancing_499 — the existing generic CMS product page,
// there is no separate Pro workspace), and Find Opportunities
// (/opportunities — the existing Client Finder product). Everything
// else is not yet built and is marked "Soon" rather than linking to a
// page that doesn't do what the label promises — same convention
// components/cms/CmsSidebar.tsx already uses, which is left untouched.
//
// Per-item/per-heading entitlement badges were intentionally removed in
// favor of the single, clearly-separated "Your Plans" status block
// (PlanStatus.tsx) rendered once in the Sidebar — showing the same
// information in two places would crowd the nav without adding
// information.
export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
      { label: 'My Library', href: '/access', icon: Library },
    ],
  },
  {
    heading: 'Learn — Plus',
    headingIcon: GraduationCap,
    headingHref: '/access/ai_income_99',
    items: [
      { label: 'Explore Roadmaps', icon: Compass, soon: true },
      { label: 'My Learning', icon: BookOpen, soon: true },
      { label: 'AI Tutor', icon: Bot, soon: true },
      { label: 'Research', icon: FlaskConical, soon: true },
      { label: 'Assessments', icon: ClipboardCheck, soon: true },
    ],
  },
  {
    heading: 'Build — Pro',
    headingIcon: Hammer,
    headingHref: '/access/ai_freelancing_499',
    items: [{ label: 'Pro Projects', href: '/access/ai_freelancing_499', icon: Hammer }],
  },
  {
    heading: 'Sell — Max',
    headingIcon: TrendingUp,
    headingHref: '/opportunities',
    items: [{ label: 'Find Opportunities', href: '/opportunities', icon: TrendingUp }],
  },
  {
    heading: 'Account',
    headingIcon: Settings,
    items: [
      { label: 'My Plans', icon: Wallet, soon: true },
      { label: 'Settings', icon: Settings, soon: true },
    ],
  },
];
