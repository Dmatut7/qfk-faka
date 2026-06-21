import * as React from 'react';

/**
 * Small pill label for status and metadata. The semantic variants map to the
 * platform's trust language: success = 已支付/有货, pending = 待支付, danger =
 * 缺货/失败, secure = 加密/担保, brand = 推荐/热卖.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color. @default "neutral" */
  variant?: 'neutral' | 'brand' | 'success' | 'pending' | 'danger' | 'secure';
  /** Filled (high-emphasis) instead of soft tint. */
  solid?: boolean;
  /** Show a leading status dot. */
  dot?: boolean;
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
