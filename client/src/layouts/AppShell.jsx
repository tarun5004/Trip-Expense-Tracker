/**
 * @component AppShell
 * @description Main application layout wrapper providing responsive navigation (Sidebar on Desktop, BottomNav on Mobile).
 * @usedBy Protected routes (Dashboard, Groups, Activity, Profile)
 * @connectsTo React Router (Outlet)
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import ROUTES from '../constants/routes';
import Icon from '../components/atoms/Icon';
import Avatar from '../components/atoms/Avatar';
import Tooltip from '../components/atoms/Tooltip';

// Define core navigation links
const NAV_LINKS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'home' },
  { path: ROUTES.GROUPS, label: 'Groups', icon: 'users' },
  { path: ROUTES.ACTIVITY, label: 'Activity', icon: 'activity' },
  { path: ROUTES.PROFILE, label: 'Profile', icon: 'user' },
];

export const AppShell = ({ user, unreadNotificationsCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-body">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-10">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800">SplitSmart</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                isActive 
                  ? "bg-teal-50 text-teal-700" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon name={link.icon} size={20} className={location.pathname.startsWith(link.path) ? "text-teal-600" : "text-slate-400"} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User Snippet */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <Avatar name={user?.name || 'User'} src={user?.avatarUrl} size="md" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{user?.name || 'John Doe'}</span>
              <span className="text-xs text-slate-500 truncate">{user?.email || 'john@example.com'}</span>
            </div>
            <Icon name="more-horizontal" size={16} className="text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <span className="font-display font-bold text-lg text-slate-800">SplitSmart</span>
          </div>
          
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
            <Icon name="bell" size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            )}
          </button>
        </header>

        {/* Desktop Header (Optional Utility Bar) */}
        <header className="hidden md:flex items-center justify-end h-16 px-8 bg-white border-b border-slate-200 shrink-0">
          <Tooltip content="Notifications">
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">
              <Icon name="bell" size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
          </Tooltip>
        </header>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth focus:outline-none" id="main-content" tabIndex="-1">
          <div className="max-w-4xl mx-auto w-full pb-20 md:pb-0 h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t border-slate-200 z-30 flex items-center justify-around pb-safe">
        {NAV_LINKS.map(link => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 focus:outline-none"
            >
               <Icon 
                 name={link.icon} 
                 size={20} 
                 className={cn("transition-colors", isActive ? "text-teal-600" : "text-slate-400")} 
                 fill={isActive ? "currentColor" : "none"}
               />
               <span className={cn(
                 "text-[10px] font-medium transition-colors",
                 isActive ? "text-teal-700 font-semibold" : "text-slate-500"
               )}>
                 {link.label}
               </span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};

export default AppShell;
