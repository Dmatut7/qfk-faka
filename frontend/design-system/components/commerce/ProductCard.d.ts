import * as React from 'react';

/**
 * Storefront product tile — name, short description, price, and live stock
 * status. Auto-shows a 缺货 badge and dims when stock is 0. Clickable to detail.
 */
export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Product name. */
  name: React.ReactNode;
  /** Short one/two-line description. */
  desc?: React.ReactNode;
  /** Current price. */
  price: number;
  /** Original price (struck-through). */
  original?: number;
  /** Available stock — 0 renders the out-of-stock state. */
  stock?: number;
  /** Thumbnail node (emoji, <img>, brand glyph). */
  thumb?: React.ReactNode;
  /** Units sold, shown small. */
  sold?: number;
  /** Override the default stock badge. */
  badge?: React.ReactNode;
  /** Click handler (ignored when out of stock). */
  onClick?: () => void;
}

export function ProductCard(props: ProductCardProps): JSX.Element;
