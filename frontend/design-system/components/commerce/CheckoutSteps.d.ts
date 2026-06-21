import * as React from 'react';

/**
 * Horizontal progress indicator for the buy journey 选购→下单→付款→取卡.
 * Completed steps show a check, current step is highlighted blue.
 */
export interface CheckoutStepsProps {
  /** Step labels. @default ["选购","下单","付款","取卡"] */
  steps?: string[];
  /** Zero-based index of the current step. @default 0 */
  current?: number;
  className?: string;
}

export function CheckoutSteps(props: CheckoutStepsProps): JSX.Element;
