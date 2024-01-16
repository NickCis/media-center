'use client';

import { usePlaylists } from '@/data/playlists';
import { Frame } from '@/components/frame';
import { VideoSection } from '@/components/video-section';
import { PodcastEmptyPlaceholder } from '@/components/playlist-empty-placeholder';

// https://ui.shadcn.com/examples/music
// https://github.com/shadcn-ui/ui/blob/main/apps/www/app/examples/music/

export default function Home() {
  const playlists = usePlaylists();

  return (
    <Frame>
      {playlists.length ? (
        playlists.map(({ data, refetch }) => {
          if (!data) return;
          const { src, entries } = data;
          return entries.map(({ title, entries }, index) => (
            <VideoSection
              key={`${index}-${src}`}
              title={title}
              entries={entries}
              onRefreshClick={() => {
                refetch();
              }}
            />
          ));
        })
      ) : (
        <PodcastEmptyPlaceholder />
      )}
    </Frame>
  );
}
