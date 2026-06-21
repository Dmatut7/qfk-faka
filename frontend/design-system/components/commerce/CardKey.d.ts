import * as React from 'react';

/**
 * The delivered card-secret block — the payoff of the whole flow. Shows a
 * monospace code with a one-tap copy button when paid; a locked placeholder
 * (never reveals the code) when unpaid. Render one per quantity purchased.
 */
export interface CardKeyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The card secret / key string. */
  code?: string;
  /** Header label. @default "卡密" */
  label?: React.ReactNode;
  /** 1-based index shown as a pill when buying multiple. */
  index?: number;
  /** Hide the code and show a lock placeholder (unpaid orders). */
  locked?: boolean;
  /** Message shown in locked state. @default "支付完成后自动显示" */
  lockedHint?: React.ReactNode;
  /** Called with the copied text after a successful copy. */
  onCopy?: (text: string) => void;
}

export function CardKey(props: CardKeyProps): JSX.Element;
