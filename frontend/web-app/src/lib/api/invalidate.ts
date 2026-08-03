// Query invalidation helpers keyed by the generated operation names.
//
// Entities embed each other: playlists and sections carry their sermons,
// sections carry their playlists. Touching any of them therefore refreshes
// the related lists AND details, otherwise list/detail pages show stale data.
import type { QueryClient } from '@tanstack/svelte-query';

function byOperation(operation: string): [{ _id: string }] {
  return [{ _id: operation }];
}

function byOperationWithPath(operation: string, path: Record<string, unknown>): unknown[] {
  return [{ _id: operation, path }];
}

export function invalidateOperation(queryClient: QueryClient, operation: string): void {
  queryClient.invalidateQueries({ queryKey: byOperation(operation) });
}

// After touching a sermon, refresh the sermon list/detail plus every playlist
// and section query that may embed it.
export function invalidateSermon(queryClient: QueryClient, sermonId?: string): void {
  invalidateOperation(queryClient, 'sermonControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindAll');
  invalidateOperation(queryClient, 'sectionControllerFindAll');
  invalidateOperation(queryClient, 'playlistControllerFindOne');
  invalidateOperation(queryClient, 'sectionControllerFindOne');
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
