import * as React from 'react';

/**
 * Status pill — a small rounded, tinted label that carries a semantic tone.
 * Used for order states (待支付/已发货/已退款), merchant audit states, risk
 * levels, etc. Tone maps to the semantic color tokens.
 */
export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color. */
  tone?: 'neutral' | 'brand' | 'success' | 'pending' | 'danger' | 'secure';
  /** Leading status dot in the current color. */
  dot?: boolean;
  children?: React.ReactNode;
}

export function Pill(props: PillProps): JSX.Element;
