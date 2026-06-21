import * as React from 'react';

/**
 * Labeled text input with optional leading icon, hint and error states.
 * Used for the email field that receives card keys, and the order-lookup field.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input. */
  label?: React.ReactNode;
  /** Helper text below the field. */
  hint?: React.ReactNode;
  /** Error message; turns the field red and overrides hint. */
  error?: React.ReactNode;
  /** Show a required asterisk. */
  required?: boolean;
  /** Leading icon node (e.g. a Lucide <Mail/>). */
  icon?: React.ReactNode;
}

export function Input(props: InputProps): JSX.Element;
