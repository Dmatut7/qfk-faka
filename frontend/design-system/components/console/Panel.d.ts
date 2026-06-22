import * as React from 'react';

/**
 * Console panel — a white, rounded, soft-shadowed card with an optional
 * header (title + subtitle on the left, action buttons on the right) and a
 * padded body. The workhorse container for every console screen section.
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Header title (bold). Omit for a header-less card. */
  title?: React.ReactNode;
  /** Header subtitle (muted, under the title). */
  subtitle?: React.ReactNode;
  /** Right-aligned header actions, e.g. buttons. */
  actions?: React.ReactNode;
  /** Body content. */
  children?: React.ReactNode;
  /** Pad the body 18px (default true). Set false for flush tables. */
  padded?: boolean;
}

export function Panel(props: PanelProps): JSX.Element;
