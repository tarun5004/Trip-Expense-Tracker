/**
 * @component UserChip
 * @description Small pill displaying a user's avatar and name, optionally removable.
 * @usedBy ExpenseForm (custom split list), GroupMemberList grid views
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../atoms/Avatar';
import Icon from '../atoms/Icon';

export const UserChip = ({
  user,
  removable = false,
  onRemove,
  className,
  onClick,
}) => {
  if (!user) return null;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 text-sm font-medium text-slate-700 transition-colors",
        onClick && "cursor-pointer hover:bg-slate-50",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : "group"}
      tabIndex={onClick ? 0 : undefined}
    >
      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
      <span className="truncate max-w-[120px]">{user.name}</span>
      
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(user);
          }}
          className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
          aria-label={`Remove ${user.name}`}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
};

export default UserChip;
