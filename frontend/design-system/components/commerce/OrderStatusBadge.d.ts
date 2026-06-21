import * as React from 'react';

/**
 * Order lifecycle badge with the platform's canonical status vocabulary and
 * colors. Use on the lookup/retrieval page and order summaries.
 */
export interface OrderStatusBadgeProps {
  /** Order state. @default "pending" */
  status?: 'pending' | 'paid' | 'delivered' | 'failed' | 'refunded' | 'closed';
  /** High-emphasis filled style. */
  solid?: boolean;
  /** Override the default Chinese label. */
  label?: React.ReactNode;
}

export function OrderStatusBadge(props: OrderStatusBadgeProps): JSX.Element;
