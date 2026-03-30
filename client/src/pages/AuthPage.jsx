/**
 * @component AuthPage
 * @description Authentication screen capable of toggling between standard Login and Registration schemas.
 * @usedBy Route: /auth 
 */

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '../components/molecules/FormField';
import Input from '../components/atoms/Input';
import Button from '../components/atoms/Button';
import ROUTES from '../constants/routes';

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegister = searchParams.get('tab') === 'register';
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const toggleMode = () => {
    setSearchParams({ tab: isRegister ? 'login' : 'register' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate generic login delay
    setTimeout(() => {
       setIsLoading(false);
       navigate(ROUTES.DASHBOARD);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          {isRegister ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {isRegister ? 'Start tracking expenses with friends.' : 'Log in to your SplitSmart account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <FormField label="Full Name">
             <Input 
               required 
               placeholder="John Doe" 
               value={name}
               onChange={e => setName(e.target.value)}
             />
          </FormField>
        )}

        <FormField label="Email address">
           <Input 
             type="email" 
             required 
             placeholder="you@example.com"
             value={email}
             onChange={e => setEmail(e.target.value)}
           />
        </FormField>

        <FormField label="Password">
           <Input 
             type="password" 
             required 
             placeholder="••••••••"
             value={password}
             onChange={e => setPassword(e.target.value)}
           />
        </FormField>

        <div className="mt-4">
          <Button fullWidth type="submit" size="lg" loading={isLoading}>
            {isRegister ? 'Sign up' : 'Log in'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
        </span>{' '}
        <button 
          type="button" 
          onClick={toggleMode}
          className="font-semibold text-teal-600 hover:text-teal-700 transition-colors focus:outline-none focus:underline"
        >
          {isRegister ? 'Log in' : 'Sign up'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
