/**
 * @component ActivityFeed
 * @description Renders a chronological stream of immutable system events (Activity Logs).
 * @usedBy ActivityPage, GroupDetailPage
 * @connectsTo Realtime state hooks to highlight 'new' items
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../atoms/Avatar';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import Spinner from '../atoms/Spinner';
import EmptyState from '../atoms/EmptyState';
import ActivityItemSkeleton from '../skeletons/ActivityItemSkeleton';
import { formatDate } from '../../utils/format';

export const ActivityFeed = ({
  activities = [],
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  className,
}) => {

  const getActivityConfig = (actionType) => {
    switch(actionType) {
      case 'created': return { color: 'text-emerald-600', icon: 'plus-circle' };
      case 'updated': return { color: 'text-amber-500', icon: 'edit-2' };
      case 'deleted': return { color: 'text-rose-600', icon: 'trash' };
      case 'settled': return { color: 'text-teal-600', icon: 'check-circle' };
      default: return { color: 'text-slate-500', icon: 'activity' };
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className={cn("flex flex-col gap-4 w-full h-full", className)}>
        {[1, 2, 3, 4, 5].map(i => <ActivityItemSkeleton key={i} />)}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState 
        icon="activity" 
        title="No activity yet" 
        description="Transactions and updates will appear here chronologically naturally as your group grows."
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex flex-col divide-y divide-slate-100", className)}>
      {activities.map((activity) => {
        const { id, user, action_type, entity_type, metadata, created_at, isNew } = activity;
        const config = getActivityConfig(action_type);

        return (
          <div key={id} className={cn(
            "flex gap-3 py-3 w-full transition-colors",
            isNew && "bg-teal-50/50 -mx-4 px-4 rounded-lg animate-in fade-in duration-500"
          )}>
            <div className="shrink-0 mt-1 relative">
              <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-50 flex items-center justify-center border border-white",
                config.color
              )}>
                <Icon name={config.icon} size={10} />
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-grow pt-0.5">
              <p className="text-sm text-slate-800 leading-snug">
                <span className="font-semibold">{user?.name}</span>{' '}
                <span className="text-slate-600">{action_type}</span>{' '}
                {entity_type === 'expense' && 'an '}
                <span className="font-medium text-slate-700">{entity_type}</span>
              </p>
              
              {/* Parse contextual metadata like titles or amounts if present */}
              {metadata?.title && (
                <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                  "{metadata.title}"
                </p>
              )}
              
              <span className="text-xs text-slate-400 mt-1">
                {formatDate(created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            
            {isNew && (
              <div className="shrink-0 flex items-center">
                <Badge variant="primary" size="sm" label="New" />
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <div className="py-6 flex justify-center">
          <button 
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {isLoadingMore ? <Spinner size="sm" /> : 'Load more items'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
