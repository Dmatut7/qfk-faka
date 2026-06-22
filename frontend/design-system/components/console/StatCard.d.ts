import * as React from 'react';

/**
 * Console KPI stat card. Default is a white card with a tinted icon chip,
 * a muted label, a big tabular number and a sub line (use it with Delta for
 * a YoY/DoD comparison). The `filled` variant is a solid orange-gradient
 * card reserved for the single hero KPI on a dashboard (e.g. 今日成交额).
 *
 * Color comes from tokens — never hard-code. Render money with the kit's
 * Money helper for tabular alignment.
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric label. */
  label: React.ReactNode;
  /** Big value (string or a <Money/> node). */
  value: React.ReactNode;
  /** Icon node shown in the chip (e.g. an <Icons.Zap/>). */
  icon?: React.ReactNode;
  /** Icon-chip tint (ignored when filled). */
  tone?: 'brand' | 'success' | 'pending' | 'secure' | 'danger' | 'neutral';
  /** Secondary line under the value (comparison / breakdown). */
  sub?: React.ReactNode;
  /** Solid orange-gradient hero variant — use for ONE KPI per board. */
  filled?: boolean;
}

export function StatCard(props: StatCardProps): JSX.Element;
