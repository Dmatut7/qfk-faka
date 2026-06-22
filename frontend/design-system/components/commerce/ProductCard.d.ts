import * as React from 'react';

/**
 * Image-led Taobao-style storefront product tile. Full-bleed 1:1 media
 * (emoji + warm gradient placeholder when no art), a type badge over the
 * image, one corner badge (限时 promo / 仅剩 N low-stock / 已售罄), a
 * promo-prefixed 2-line title, red price with optional label, subsidy/promo
 * chips, sold count and a round cart button. Dims + disables when stock is 0.
 *
 * @startingPoint section="Commerce" subtitle="Taobao-style product tile for the buyer grid" viewport="220x320"
 */
export interface ProductCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Product name (2-line clamp). */
  name: React.ReactNode;
  /** Gray one-line subtitle, e.g. 本店热销第1名. */
  subtitle?: React.ReactNode;
  /** Current price. */
  price: number;
  /** Original price (struck-through). */
  original?: number;
  /** Small gray label after the price, e.g. 补贴后 / 首单价. */
  priceLabel?: React.ReactNode;
  /** Available stock — 0 renders the 已售罄 state; ≤5 shows a 仅剩 N corner. */
  stock?: number;
  /** Product image URL — preferred over thumb when present. */
  image?: string;
  /** Emoji / glyph placeholder shown when no image. */
  thumb?: React.ReactNode;
  /** Category label shown over the placeholder. */
  category?: React.ReactNode;
  /** Type badge over the image, e.g. 卡密 / 知识 / 资源 / 权益. */
  typeLabel?: React.ReactNode;
  /** Promo label — red mini-badge before the title + 限时 corner badge. */
  promo?: React.ReactNode;
  /** Chip row, e.g. [{text:'平台担保',tone:'subsidy'},{text:'立减20%',tone:'promo'}]. */
  tags?: Array<{ text: React.ReactNode; tone?: 'subsidy' | 'promo' }>;
  /** Units sold, shown small. */
  sold?: number;
  /** Cart-button click (stops propagation). Button hidden when out of stock. */
  onCart?: () => void;
  /** Card click handler (ignored when out of stock). */
  onClick?: () => void;
}

export function ProductCard(props: ProductCardProps): JSX.Element;
