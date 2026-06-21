import * as React from 'react';

/**
 * Selectable payment-method row (single-select, radio semantics). Stack several
 * and drive selection from parent state on the payment page.
 */
export interface PaymentOptionProps {
  /** Method name, e.g. "微信支付". */
  name: React.ReactNode;
  /** Sub-line description. */
  desc?: React.ReactNode;
  /** Leading icon node (emoji, <img>, or SVG). */
  icon?: React.ReactNode;
  /** Small green tag, e.g. "推荐". */
  tag?: React.ReactNode;
  /** Selected state. */
  selected?: boolean;
  /** Click handler — set this option as selected. */
  onSelect?: () => void;
}

export function PaymentOption(props: PaymentOptionProps): JSX.Element;
