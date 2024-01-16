import { Button } from '@/components/ui/button';
import { ListMusic } from 'lucide-react';
import { NewPlaylistSourceDialog } from '@/components/new-playlist-source-dialog';

export function PodcastEmptyPlaceholder() {
  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <ListMusic className="h-10 w-10 text-muted-foreground" />

        <h3 className="mt-4 text-lg font-semibold">No playlists added</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You have not added any playlists. Add one below.
        </p>
        <NewPlaylistSourceDialog>
          <Button size="sm" className="relative">
            Add Playlist
          </Button>
        </NewPlaylistSourceDialog>
      </div>
    </div>
  );
}
