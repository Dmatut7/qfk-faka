import * as React from 'react';

/**
 * Money display with consistent tabular figures, small currency symbol and
 * optional struck-through original price. Use accent tone for the buy price,
 * neutral for totals inside summaries.
 */
export interface PriceTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Numeric amount (formatted to 2 decimals, zh-CN grouping). */
  amount: number;
  /** Optional original price, shown struck-through. */
  original?: number;
  /** Currency symbol. @default "¥" */
  currency?: string;
  /** Size. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** "accent" = red sale color, "neutral" = ink. @default "accent" */
  tone?: 'accent' | 'neutral';
}

export function PriceTag(props: PriceTagProps): JSX.Element;
