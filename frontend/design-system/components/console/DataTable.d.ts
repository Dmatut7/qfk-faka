import * as React from 'react';

export interface DataTableColumn<T = any> {
  /** Unique column key (and default cell accessor). */
  key: string;
  /** Header label. */
  title: React.ReactNode;
  /** Custom cell renderer; receives the row. Falls back to `row[key]`. */
  render?: (row: T) => React.ReactNode;
  /** Cell text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Fixed/max column width in px. */
  width?: number;
}

/**
 * Console data table. Renders a horizontally-scrollable table with a muted
 * header, hairline row separators and a brand-tinted row hover. Built-in
 * loading (spinner), error (retry bar) and empty states so list screens don't
 * re-implement them. Right-align numeric/amount columns.
 */
export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Show the centered spinner. */
  loading?: boolean;
  /** Error message — renders a retry bar instead of the table. */
  error?: string;
  /** Retry handler for the error bar. */
  onReload?: () => void;
  /** Row identity field (default 'id'). */
  rowKey?: string;
  /** Empty-state text. */
  empty?: React.ReactNode;
  /** Empty-state icon node. */
  emptyIcon?: React.ReactNode;
}

export function DataTable<T = any>(props: DataTableProps<T>): JSX.Element;
