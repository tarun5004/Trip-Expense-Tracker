/**
 * @component AuthLayout
 * @description Centered aesthetic card layout specifically designed for credential acquisition (Login/Register).
 * @usedBy AuthPage
 * @connectsTo None
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-8">
      {/* Background Decor */}
      <div className="absolute top-0 w-full h-[40vh] bg-teal-600 rounded-b-[40%] sm:rounded-b-[50%] -z-10 shadow-inner overflow-hidden">
        {/* Abstract pattern / noise overlay could go here */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      </div>

      {/* Branding */}
      <div className="flex flex-col items-center mb-8 text-white animate-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
          <span className="font-display font-bold text-3xl text-teal-600 tracking-tighter">S</span>
        </div>
        <h1 className="text-2xl font-display font-bold tracking-tight">SplitSmart</h1>
        <p className="text-teal-100 font-medium text-sm mt-1">Expense splitting, simplified.</p>
      </div>

      {/* Card Container */}
      <main className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500 delay-100 fill-mode-backwards">
        <Outlet />
      </main>

      {/* Footer minimal legal/links */}
      <footer className="mt-8 text-xs font-medium text-slate-500 text-center z-10">
        <p>&copy; {new Date().getFullYear()} SplitSmart Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
