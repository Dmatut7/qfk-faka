import * as React from 'react';

/**
 * Horizontal product row for the storefront listing — square thumbnail on the
 * left; name, price, category tag and date on the right. The marketplace-style
 * alternative to the grid ProductCard; better for dense mobile lists.
 */
export interface ProductListItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Product name (single-line clamp). */
  name: React.ReactNode;
  /** Short description (single-line clamp). */
  desc?: React.ReactNode;
  /** Current price. */
  price: number;
  /** Original price (struck-through). */
  original?: number;
  /** Available stock — 0 dims the row and shows 缺货. */
  stock?: number;
  /** Thumbnail node (<img>, emoji, glyph). */
  thumb?: React.ReactNode;
  /** Category label shown as a gray tag. */
  category?: React.ReactNode;
  /** Listed/updated date, shown bottom-right. */
  date?: React.ReactNode;
  /** Click handler (ignored when out of stock). */
  onClick?: () => void;
}

export function ProductListItem(props: ProductListItemProps): JSX.Element;
