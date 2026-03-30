/**
 * @component GroupMemberList
 * @description Standard table/array loop tracking and rendering an entire group's cohort relationships.
 * @usedBy GroupMembersPage, GroupDetailPage
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import UserChip from '../molecules/UserChip';
import Badge from '../atoms/Badge';
import EmptyState from '../atoms/EmptyState';
import Avatar from '../atoms/Avatar';
import { formatDate } from '../../utils/format';

export const GroupMemberList = ({
  members = [], // Format: { userId, user: {}, role, joinedAt }
  adminId,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 opacity-50 pointer-events-none">
         {/* Placeholder array */}
        <div className="h-14 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-14 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-14 w-full bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (members.length === 0) {
    return <EmptyState title="No members found" description="Invite someone to get started." />;
  }

  return (
    <div className={cn("grid w-full divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden", className)}>
      {members.map((member) => {
        const isAdmin = member.userId === adminId || member.role === 'admin';
        
        return (
          <div key={member.userId} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={member.user?.name} src={member.user?.avatarUrl} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">
                  {member.user?.name}
                </span>
                <span className="text-xs text-slate-500">
                  Joined {formatDate(member.joinedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              {isAdmin && (
                <Badge variant="primary" size="sm" label="Admin" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupMemberList;
