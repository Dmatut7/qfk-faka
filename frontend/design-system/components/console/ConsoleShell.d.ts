import * as React from 'react';

export interface ConsoleNavItem {
  /** Unique key — what `active` / `onNavigate` use. */
  key: string;
  /** Menu label. */
  label: React.ReactNode;
  /** Icon component, called as `<Icon size color />`. */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}
export interface ConsoleNavGroup {
  /** Group heading (first 2 chars also label the icon rail). */
  group: string;
  /** Group icon component for the rail. */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  items: ConsoleNavItem[];
}

/**
 * The signature back-office layout: a 60px icon rail (one button per nav
 * group) + a 224px grouped text menu + a 56px top bar (breadcrumb · user ·
 * logout) + the scrolling main area, which renders an H1 of the active item's
 * label above `children`. Collapses to a hamburger drawer under 860px.
 * Selection is controlled — keep `active` in parent state.
 */
export interface ConsoleShellProps {
  /** Grouped navigation. */
  nav: ConsoleNavGroup[];
  /** Active item key. */
  active: string;
  /** Called with a key when a nav item is chosen. */
  onNavigate: (key: string) => void;
  /** Sidebar + breadcrumb root title, e.g. 秒卡 · 商户. */
  brandTitle?: string;
  /** Muted line under the sidebar title (store name / role). */
  brandSub?: React.ReactNode;
  /** Top-bar user label. */
  user?: React.ReactNode;
  /** Logout handler — shows the sidebar + top-bar logout controls when set. */
  onLogout?: () => void;
  /** Optional mark inside the rail's brand square (defaults to 秒). */
  brandMark?: React.ReactNode;
  /** Active screen content. */
  children?: React.ReactNode;
}

export function ConsoleShell(props: ConsoleShellProps): JSX.Element;
