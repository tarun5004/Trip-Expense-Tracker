/**
 * @component PaymentFlow
 * @description Wizard container isolating the payment submission variables avoiding global state mutation prior to successful database ack.
 * @usedBy SettleUpPage
 * @connectsTo payment.service.js mutations
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import AmountInput from '../molecules/AmountInput';
import FormField from '../molecules/FormField';
import Select from '../atoms/Select';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Avatar from '../atoms/Avatar';
import Icon from '../atoms/Icon';

export const PaymentFlow = ({
  viewerUser,
  availablePayees = [],
  defaultPayeeId,
  defaultAmountCents = 0,
  onSubmit, // Promise
  onCancel,
}) => {
  const [step, setStep] = useState(defaultPayeeId ? 2 : 1);
  const [payeeId, setPayeeId] = useState(defaultPayeeId || '');
  const [amountCents, setAmountCents] = useState(defaultAmountCents);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Mock external options
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-sync if external default changes
  useEffect(() => {
    if (defaultPayeeId && !payeeId) setPayeeId(defaultPayeeId);
    if (defaultAmountCents > 0 && amountCents === 0) setAmountCents(defaultAmountCents);
  }, [defaultPayeeId, defaultAmountCents, payeeId, amountCents]);

  const payee = availablePayees.find(p => p.userId === payeeId);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payeeId || amountCents <= 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ payeeId, amountCents, method: paymentMethod, note });
      // If parent routes away, we dont need to reset.
    } catch {
      setIsSubmitting(false); // Parent handles error toast
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      
      {/* Wizard Header Progress */}
      <div className="bg-teal-50 px-6 py-4 flex items-center justify-between border-b border-teal-100">
        <h2 className="font-bold text-teal-800 text-lg flex items-center gap-2">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="p-1 hover:bg-teal-100 rounded-md transition-colors mr-1">
              <Icon name="arrow-left" size={18} />
            </button>
          )}
          Record a Payment
        </h2>
        <span className="text-teal-600 font-medium text-sm">Step {step} of 2</span>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Who are you paying?</h3>
            
            <div className="flex flex-col gap-2">
              {availablePayees.map(p => (
                <button
                  key={p.userId}
                  onClick={() => {
                    setPayeeId(p.userId);
                    handleNext();
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                    payeeId === p.userId 
                      ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" 
                      : "border-slate-200 hover:border-teal-300 hover:bg-slate-50 relative"
                  )}
                >
                  <Avatar name={p.name} src={p.avatarUrl} size="lg" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="text-sm text-rose-600 font-medium tracking-tight">
                       You owe them ₹{(p.owedToThemCents / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="ml-auto text-slate-400">
                     <Icon name="chevron-right" size={20} />
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8">
              <Button variant="ghost" fullWidth onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 2 && payee && (
          <form onSubmit={handleSubmit} className="animate-in slide-in-from-right-4 duration-300 space-y-6">
            
            {/* Visual Header confirmation */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Avatar name={viewerUser?.name} src={viewerUser?.avatarUrl} size="lg" />
              <div className="bg-slate-100 text-slate-400 p-2 rounded-full hidden sm:block">
                 <Icon name="arrow-right" size={24} />
              </div>
              <Avatar name={payee.name} src={payee.avatarUrl} size="lg" />
            </div>

            <FormField label="Amount">
              <AmountInput 
                valueCents={amountCents}
                onChangeCents={setAmountCents}
                className="text-2xl font-bold py-4 h-14"
              />
            </FormField>

            <FormField label="Method">
              <Select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'upi', label: 'UPI / Bank Transfer' },
                  { value: 'venmo', label: 'Venmo / External' },
                ]}
              />
            </FormField>

            <FormField label="Optional Note">
              <Input 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thanks for covering dinner!"
              />
            </FormField>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="secondary" fullWidth onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" variant="primary" fullWidth loading={isSubmitting} disabled={amountCents <= 0}>
                Confirm
              </Button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

export default PaymentFlow;
