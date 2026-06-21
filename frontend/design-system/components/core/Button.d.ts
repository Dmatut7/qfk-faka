import * as React from 'react';

/**
 * Primary call-to-action button. Use the primary variant for the single most
 * important action on a screen ("立即购买", "确认支付"); secondary/neutral/ghost
 * for supporting actions; danger/success sparingly for destructive/confirm states.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger' | 'success';
  /** Size. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to full container width. */
  block?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Icon node rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label. */
  iconRight?: React.ReactNode;
  /** Render as a different element, e.g. "a". @default "button" */
  as?: 'button' | 'a';
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
