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
  invalidateOperation(queryClient, 'getAllSermons');
  invalidateOperation(queryClient, 'getAllPlaylists');
  invalidateOperation(queryClient, 'getAllSections');
  invalidateOperation(queryClient, 'getPlaylistById');
  invalidateOperation(queryClient, 'getSectionById');
  if (sermonId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getSermonById', { id: sermonId }),
    });
  }
}

// After touching a playlist, refresh the playlist list/detail plus every
// sermon and section query that may embed it.
export function invalidatePlaylist(queryClient: QueryClient, playlistId?: string): void {
  invalidateOperation(queryClient, 'getAllPlaylists');
  invalidateOperation(queryClient, 'getAllSermons');
  invalidateOperation(queryClient, 'getAllSections');
  invalidateOperation(queryClient, 'getSermonById');
  invalidateOperation(queryClient, 'getSectionById');
  if (playlistId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getPlaylistById', { id: playlistId }),
    });
  }
}

// After touching a section, refresh the section list/detail plus every
// playlist and sermon query that may embed it.
export function invalidateSection(queryClient: QueryClient, sectionId?: string): void {
  invalidateOperation(queryClient, 'getAllSections');
  invalidateOperation(queryClient, 'getAllPlaylists');
  invalidateOperation(queryClient, 'getAllSermons');
  invalidateOperation(queryClient, 'getPlaylistById');
  invalidateOperation(queryClient, 'getSermonById');
  if (sectionId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getSectionById', { id: sectionId }),
    });
  }
}
