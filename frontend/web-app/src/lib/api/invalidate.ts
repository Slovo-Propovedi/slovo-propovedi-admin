// Query invalidation helpers keyed by the generated operation names.
import type { QueryClient } from '@tanstack/query-core';

function byOperation(operation: string): [{ _id: string }] {
  return [{ _id: operation }];
}

function byOperationWithPath(operation: string, path: Record<string, unknown>): unknown[] {
  return [{ _id: operation, path }];
}

export function invalidateOperation(queryClient: QueryClient, operation: string): void {
  queryClient.invalidateQueries({ queryKey: byOperation(operation) });
}

// After touching a sermon, refresh the list and any detail query for that id.
export function invalidateSermon(queryClient: QueryClient, sermonId?: string): void {
  invalidateOperation(queryClient, 'getAllSermons');
  if (sermonId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getSermonById', { id: sermonId }),
    });
  }
}

// After touching a playlist, refresh the list and any detail query for that id.
export function invalidatePlaylist(queryClient: QueryClient, playlistId?: string): void {
  invalidateOperation(queryClient, 'getAllPlaylists');
  if (playlistId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getPlaylistById', { id: playlistId }),
    });
  }
}

// After touching a section, refresh the list and any detail query for that id.
export function invalidateSection(queryClient: QueryClient, sectionId?: string): void {
  invalidateOperation(queryClient, 'getAllSections');
  if (sectionId) {
    queryClient.invalidateQueries({
      queryKey: byOperationWithPath('getSectionById', { id: sectionId }),
    });
  }
}
