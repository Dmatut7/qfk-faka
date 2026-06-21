import * as React from 'react';

/**
 * Quantity selector for the buy flow. Clamped between min and max (stock).
 * Controlled — pass value and onChange.
 */
export interface QuantityStepperProps {
  /** Current quantity. @default 1 */
  value?: number;
  /** Minimum. @default 1 */
  min?: number;
  /** Maximum (e.g. available stock). @default 99 */
  max?: number;
  /** Size. @default "md" */
  size?: 'sm' | 'md';
  /** Called with the next clamped value. */
  onChange?: (value: number) => void;
  className?: string;
}

export function QuantityStepper(props: QuantityStepperProps): JSX.Element;
