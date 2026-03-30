/**
 * @component AmountInput
 * @description Masks user decimal input and translates it to standard system Integer Cents.
 * @usedBy ExpenseForm, PaymentFlow
 * @connectsTo None (controlled component)
 */

import React, { useState, useEffect } from 'react';
import Input from '../atoms/Input';

export const AmountInput = React.forwardRef(({
  valueCents,
  onChangeCents,
  currencySymbol = '₹',
  error,
  id,
  className,
  ...props
}, ref) => {
  // We hold local string state for smooth typing (e.g. allowing trailing "10.")
  const [localValue, setLocalValue] = useState('');

  // Sync external cents to local string format on mount or external rewrite
  useEffect(() => {
    if (valueCents === undefined || valueCents === null) return;
    const decimalStr = (valueCents / 100).toString();
    // Only update if mathematically different to avoid cursor jumps
    if (parseFloat(localValue || '0') !== parseFloat(decimalStr || '0')) {
      setLocalValue(decimalStr);
    }
  }, [valueCents]);

  const handleChange = (e) => {
    const raw = e.target.value;
    
    // Allow empty
    if (raw === '') {
      setLocalValue('');
      onChangeCents?.(0);
      return;
    }

    // Restrict to numbers and max 2 decimal places using regex
    if (/^\d*\.?\d{0,2}$/.test(raw)) {
      setLocalValue(raw);
      // Convert to integer cents and fire up
      const cents = Math.round(parseFloat(raw || '0') * 100);
      onChangeCents?.(cents);
    }
  };

  return (
    <Input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      error={error}
      placeholder="0.00"
      className={className}
      leftAddon={<span className="font-semibold text-slate-800">{currencySymbol}</span>}
      {...props}
    />
  );
});

AmountInput.displayName = 'AmountInput';
export default AmountInput;
