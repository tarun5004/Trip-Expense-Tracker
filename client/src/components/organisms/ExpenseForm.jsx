/**
 * @component ExpenseForm
 * @description Highly complex multi-step entity capable of enforcing exact, fractional, shares, and equal cost splitting algorithms visually.
 * @usedBy AddExpensePage
 * @connectsTo expense.service.js mutators
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import AmountInput from '../molecules/AmountInput';
import SplitTypeSelector from '../molecules/SplitTypeSelector';
import UserChip from '../molecules/UserChip';
import FormField from '../molecules/FormField';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import Avatar from '../atoms/Avatar';
import Icon from '../atoms/Icon';

export const ExpenseForm = ({
  groupMembers = [],
  viewerUserId,
  onSubmit, // Promise wrapper
  onCancel,
}) => {
  // --- FORM STATE --- //
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(viewerUserId);
  const [splitType, setSplitType] = useState('equal'); // equal, exact, percentage, shares
  
  // Custom Splits mapping: { [userId]: Number (value depending on splitType) }
  // e.g. exact -> cents, percentage -> 0-100 float, shares -> int
  const [customSplits, setCustomSplits] = useState(() => {
    const init = {};
    groupMembers.forEach(m => init[m.userId] = 0);
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- LOGIC HELPER: Compute effective split validation --- //
  const validateSplits = () => {
    if (splitType === 'equal') return true;
    
    let sum = 0;
    const vals = Object.values(customSplits);
    
    if (splitType === 'exact') {
      sum = vals.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
      return sum === amountCents;
    }
    if (splitType === 'percentage') {
      sum = vals.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
      // Allowing tiny float anomalies
      return Math.abs(sum - 100) < 0.01;
    }
    if (splitType === 'shares') {
      sum = vals.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
      return sum > 0; // Just need at least one share
    }
    return true;
  };

  const computeValidationNotice = () => {
    if (splitType === 'equal') return null;
    let sum = 0;
    Object.values(customSplits).forEach(v => sum += Number(v) || 0);

    if (splitType === 'exact') {
      const diff = amountCents - sum;
      if (diff === 0) return { ok: true, msg: "Totals match up perfectly." };
      return { ok: false, msg: `Off by ₹${Math.abs(diff / 100).toFixed(2)}` };
    }
    if (splitType === 'percentage') {
      if (Math.abs(sum - 100) < 0.01) return { ok: true, msg: "100% matched." };
      return { ok: false, msg: `Total: ${sum}% (Must be 100%)` };
    }
    return { ok: sum > 0, msg: `Total shares: ${sum}` };
  };

  // --- HANDLERS --- //
  const handleNext = () => {
    setError(null);
    if (step === 1 && (!title || amountCents <= 0)) {
       setError("Please enter a title and amount.");
       return;
    }
    setStep(s => s + 1);
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    setError(null);
    if (!validateSplits()) {
      setError("Please ensure your split totals add up correctly.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Build the standard Engine payload expecting computed factors
      const payload = {
        title,
        totalAmountCents: amountCents,
        date,
        paidByUserId: payerId,
        splitType,
        splits: splitType === 'equal' ? [] : Object.entries(customSplits).map(([userId, val]) => ({
          userId,
          value: Number(val) || 0
        }))
      };
      await onSubmit(payload);
    } catch (e) {
      setError(e.message || "Failed to create expense.");
      setIsSubmitting(false);
    }
  };

  // --- RENDER --- //
  return (
    <div className="flex flex-col w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 flex">
        <div className={cn("bg-teal-600 transition-all duration-300", step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full")} />
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
             <Icon name="alert-circle" size={16} /> {error}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cost Details</h2>
            
            <FormField label="Description">
              <Input 
                 placeholder="e.g., Dinner at Italian place" 
                 value={title} 
                 onChange={e => setTitle(e.target.value)} 
                 autoFocus
              />
            </FormField>

            <FormField label="Total Amount">
              <AmountInput 
                valueCents={amountCents}
                onChangeCents={setAmountCents}
                className="text-lg py-3"
              />
            </FormField>

            <FormField label="Date">
               <Input 
                 type="date"
                 value={date}
                 onChange={e => setDate(e.target.value)}
               />
            </FormField>
          </div>
        )}

        {/* STEP 2: Who Paid? */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Who paid?</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
              {groupMembers.map(m => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => setPayerId(m.userId)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    payerId === m.userId 
                      ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" 
                      : "border-slate-200 hover:border-teal-300"
                  )}
                >
                  <Avatar name={m.user?.name} src={m.user?.avatarUrl} size="sm" />
                  <span className="font-medium text-slate-800 text-sm">{m.userId === viewerUserId ? 'You' : m.user?.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: The Split Math */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-slate-900">How to split?</h2>
               <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                 ₹{(amountCents / 100).toFixed(2)}
               </span>
            </div>
            
            <SplitTypeSelector 
               selectedType={splitType}
               onChange={setSplitType}
            />

            <div className="flex flex-col gap-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              {groupMembers.map((m, i) => (
                 <div key={m.userId} className={cn(
                   "flex items-center justify-between p-3 bg-white",
                   i !== groupMembers.length - 1 && "border-b border-slate-100"
                 )}>
                    <div className="flex items-center gap-3">
                       <Avatar name={m.user?.name} src={m.user?.avatarUrl} size="sm" />
                       <span className="text-sm font-medium text-slate-700">{m.user?.name}</span>
                    </div>

                    <div className="w-1/3">
                      {splitType === 'equal' ? (
                        <div className="text-right text-sm font-mono text-slate-500">
                          ₹{(amountCents / 100 / groupMembers.length).toFixed(2)}
                        </div>
                      ) : splitType === 'exact' ? (
                        <AmountInput
                           valueCents={customSplits[m.userId]}
                           onChangeCents={val => handleCustomSplitChange(m.userId, val)}
                           className="h-8 text-right text-sm"
                        />
                      ) : (
                        <Input 
                           type="number"
                           step="any"
                           min="0"
                           className="h-8 text-right text-sm font-mono"
                           value={customSplits[m.userId]}
                           onChange={e => handleCustomSplitChange(m.userId, e.target.value)}
                           rightAddon={splitType === 'percentage' ? '%' : 's'}
                        />
                      )}
                    </div>
                 </div>
              ))}
            </div>

            {/* Live Validator UI */}
            {splitType !== 'equal' && (
              <div className={cn(
                "w-full p-3 rounded-lg flex items-center justify-between text-sm font-medium font-mono border",
                computeValidationNotice().ok 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                 <span>Running Total:</span>
                 <span className="flex items-center gap-2">
                   {!computeValidationNotice().ok && <Spinner size="sm" color="danger" className="text-amber-500 animate-none opacity-50"/>}
                   {computeValidationNotice().msg}
                 </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        {step === 1 ? (
           <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        ) : (
           <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
        )}

        {step < 3 ? (
           <Button variant="primary" onClick={handleNext} disabled={step === 1 && (!title || amountCents <= 0)}>
             Next step <Icon name="chevron-right" size={16} className="ml-1" />
           </Button>
        ) : (
           <Button 
             variant="primary" 
             onClick={handleFinalSubmit} 
             loading={isSubmitting} 
             disabled={!validateSplits()}
           >
             Save expense
           </Button>
        )}
      </div>

    </div>
  );
};

export default ExpenseForm;
