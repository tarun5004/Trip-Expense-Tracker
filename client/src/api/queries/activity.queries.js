/**
 * @module activity.queries
 * @description Fetchers for Activity Feed.
 */
import apiClient from '../axios';

// Used with useInfiniteQuery
export const fetchGroupActivity = async ({ pageParam = 1, queryKey }) => {
  // Query format: ['activity', groupId]
  const [, groupId] = queryKey;
  
  // if groupId is undefined, it fetches global user activity
  const url = groupId 
    ? `/groups/${groupId}/activity?page=${pageParam}` 
    : `/activity?page=${pageParam}`;
    
  const { data } = await apiClient.get(url);
  return data; // { items: [], nextCursor: number | null }
};
