import * as React from 'react';

/**
 * Surface container — the base for product cards, order summaries, payment
 * panels. White, soft shadow, generous radius. Set interactive for hover-lift.
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Apply default inner padding. @default true */
  pad?: boolean;
  /** Hover-lift + pointer cursor (use for clickable product cards). */
  interactive?: boolean;
  /** Shadow depth. @default "sm" */
  elevation?: 'flat' | 'sm' | 'raised';
  /** Element tag. @default "div" */
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
