/**
 * @hook useGroups
 * @description Provides all data-fetching mechanisms for Group entities via React Query.
 * @usedBy DashboardPage, GroupDetailPage, Sidebar
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient';
import { fetchUserGroups, fetchGroupDetail, fetchGroupMembers } from '../api/queries/groups.queries';
import { createGroup, joinGroup, leaveGroup } from '../api/mutations/groups.mutations';

export const useGroups = () => {
  const queryClient = useQueryClient();

  const useAllGroups = () => useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
  });

  const useGroupDetail = (groupId) => useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: fetchGroupDetail,
    enabled: !!groupId,
  });

  const useMembers = (groupId) => useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: fetchGroupMembers,
    enabled: !!groupId,
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      // Invalidate the list so it fetches the newly created group natively
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      queryClient.setQueryData(queryKeys.groups.detail(newGroup.id), newGroup);
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_, { groupId }) => {
      // Optimistically blast data
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
  });

  return {
    useAllGroups,
    useGroupDetail,
    useMembers,
    createGroup: createGroupMutation,
    joinGroup: joinGroupMutation,
    leaveGroup: leaveGroupMutation,
  };
};

export default useGroups;
