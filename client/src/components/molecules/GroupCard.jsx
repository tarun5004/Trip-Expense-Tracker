/**
 * @component GroupCard
 * @description Summary card representing a group entity on the dashboard.
 * @usedBy DashboardPage
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../atoms/Avatar';
import AmountDisplay from '../atoms/AmountDisplay';
import { formatDate } from '../../utils/format';
import { Link } from 'react-router-dom';
import ROUTES from '../../constants/routes';

export const GroupCard = ({
  group,
  userBalanceCents, // Viewer's net balance within this group
  className,
}) => {
  const { id, name, description, updated_at, member_count, customAvatars = [] } = group;

  return (
    <Link 
      to={ROUTES.GROUP_DETAIL(id)}
      className={cn(
        "flex flex-col justify-between w-full h-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col pr-3">
          <h3 className="font-semibold text-slate-900 text-lg leading-tight line-clamp-1">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-snug">
              {description}
            </p>
          )}
        </div>

        {/* Simplified Member Stack Preview */}
        <div className="flex -space-x-2 overflow-hidden items-center shrink-0">
          {customAvatars.slice(0, 3).map((avatar, idx) => (
            <div key={idx} className="inline-block rounded-full ring-2 ring-white">
              <Avatar name={avatar.name} src={avatar.src} size="sm" />
            </div>
          ))}
          {member_count > 3 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-white bg-slate-100 text-xs font-medium text-slate-600 z-10">
              +{member_count - 3}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
              Your Balance
            </span>
            <AmountDisplay 
              amountCents={userBalanceCents} 
              variant="auto" 
              size="lg" 
            />
          </div>
          <span className="text-xs text-slate-400">
            Active {formatDate(updated_at || Date.now(), { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
