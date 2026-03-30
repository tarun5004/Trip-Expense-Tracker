/**
 * @component ProfilePage
 * @description Standard settings and profile metadata page.
 * @usedBy Route: /profile
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../components/atoms/Avatar';
import FormField from '../components/molecules/FormField';
import Input from '../components/atoms/Input';
import Button from '../components/atoms/Button';
import Toggle from '../components/atoms/Toggle';
import Icon from '../components/atoms/Icon';
import Divider from '../components/atoms/Divider';

export const ProfilePage = () => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000); // Simulate API latency
  };

  return (
    <div className="flex flex-col w-full h-full max-w-2xl mx-auto pb-16 animate-in slide-in-from-bottom-4 duration-300">
      
      <header className="py-6 mb-2">
         <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
           Profile & Settings
         </h1>
      </header>

      <main className="flex flex-col gap-6">
         {/* Profile Card */}
         <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
           <div className="relative group cursor-pointer">
              <Avatar name={name} size="xl" className="ring-4 ring-slate-50 shadow-sm" />
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="camera" size={20} className="text-white" />
              </div>
           </div>

           <form onSubmit={handleSave} className="flex flex-col w-full gap-4 flex-grow">
              <FormField label="Full Name">
                 <Input value={name} onChange={e => setName(e.target.value)} />
              </FormField>
              
              <FormField label="Email Address">
                 <Input value={email} disabled type="email" />
              </FormField>

              <div className="flex justify-end pt-2">
                 <Button type="submit" variant="secondary" loading={isSaving}>Save Changes</Button>
              </div>
           </form>
         </section>

         {/* Preferences */}
         <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Preferences</h3>
            
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
               <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-sm">Push Notifications</span>
                  <span className="text-sm text-slate-500">Get alerted for new expenses and settlements.</span>
               </div>
               <Toggle checked={notifications} onChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between py-4">
               <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-sm text-rose-600">Danger Zone</span>
               </div>
               <Button variant="danger" size="sm" leftIcon={<Icon name="log-out" size={16} />}>Log out</Button>
            </div>
         </section>
      </main>

    </div>
  );
};

export default ProfilePage;
