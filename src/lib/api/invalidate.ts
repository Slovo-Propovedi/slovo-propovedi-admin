// Query invalidation helpers keyed by the generated operation names.
//
// Entities embed each other: playlists and sections carry their sermons,
// sections carry their playlists. Touching any of them therefore refreshes
// the related lists AND details, otherwise list/detail pages show stale data.
import type { QueryClient } from '@tanstack/svelte-query';
import {
  getFilesQueryKey,
  sermonControllerGetDistinctValuesQueryKey,
} from '$lib/api/generated/@tanstack/svelte-query.gen';

function byOperation(operation: string): [{ _id: string }] {
  return [{ _id: operation }];
}

function byOperationWithPath(operation: string, path: Record<string, unknown>): unknown[] {
  return [{ _id: operation, path }];
}

export function invalidateOperation(queryClient: QueryClient, operation: string): void {
  queryClient.invalidateQueries({ queryKey: byOperation(operation) });
}

// After uploading an image, refresh the file library so the cover-reuse
// modal shows the new file the next time it opens.
export function invalidateFiles(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: getFilesQueryKey() });
}

// After touching a sermon, refresh the sermon list/detail plus every playlist
// and section query that may embed it, and the distinct-values suggestions
// (a new preacher or book must appear in the combobox right after create/update).
export function invalidateSermon(queryClient: QueryClient, sermonId?: string): void {
  invalidateOperation(queryClient, 'sermonControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindAll');
  invalidateOperation(queryClient, 'sectionControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindOne');
  invalidateOperation(queryClient, 'sectionControllerFindOne');
  queryClient.invalidateQueries({ queryKey: sermonControllerGetDistinctValuesQueryKey() });
  if (sermonId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('sermonControllerFindOne', { id: sermonId }),
    });
  }
}

// After touching a playlist, refresh the playlist list/detail plus every
// sermon and section query that may embed it.
export function invalidatePlaylist(queryClient: QueryClient, playlistId?: string): void {
  invalidateOperation(queryClient, 'playlistControllerFindAll');
  invalidateOperation(queryClient, 'sermonControllerFindAll');
  invalidateOperation(queryClient, 'sectionControllerFindAll');
  invalidateOperation(queryClient, 'sermonControllerFindOne');
  invalidateOperation(queryClient, 'sectionControllerFindOne');
  if (playlistId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('playlistControllerFindOne', { id: playlistId }),
    });
  }
}

// After touching a section, refresh the section list/detail plus every
// playlist and sermon query that may embed it.
export function invalidateSection(queryClient: QueryClient, sectionId?: string): void {
  invalidateOperation(queryClient, 'sectionControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindAll');
  invalidateOperation(queryClient, 'sermonControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindOne');
  invalidateOperation(queryClient, 'sermonControllerFindOne');
  if (sectionId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('sectionControllerFindOne', { id: sectionId }),
    });
  }
}

// After touching a user, refresh the user list and (optionally) the user
// detail. Users are standalone — nothing embeds them — so the list is the
// only query that always needs refreshing.
export function invalidateUsers(queryClient: QueryClient, userId?: string): void {
  invalidateOperation(queryClient, 'usersControllerFindAll');
  if (userId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('usersControllerFindOne', { id: userId }),
    });
  }
}
