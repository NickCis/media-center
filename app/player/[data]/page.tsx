import { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Frame } from '@/components/frame';
import { VideoPlayer } from '@/components/video-player';

import { atob } from '@/lib/base64';

interface PlayerProps {
  params: {
    data: string;
  };
}

interface VideoData {
  title: string;
  subtitle: string;
  src: string;
}

function usePlayerProps(data: string): VideoData | undefined {
  return useMemo(() => {
    if (!data) return;
    try {
      const decoded = atob(decodeURIComponent(data).trim());
      return JSON.parse(decoded);
    } catch (e) {
      console.warn(e);
    }
  }, [data]);
}

// eyJ0aXRsZSI6IlRoaW5raW5nIENvbXBvbmVudHMiLCJzdWJ0aXRsZSI6IkxlbmEgTG9naWMiLCJzcmMiOiJodHRwczovL25pY2tjaXMuZGRucy5uZXQ6NjM0NDMvOTExL3MwM2UwMS9tZWRpYS9TMDMwMS9tYXN0ZXIubTN1OCJ9
export default function Player({ params }: PlayerProps) {
  const video = usePlayerProps(params.data);

  return (
    <Frame classes={{ inner: 'flex flex-col' }}>
      <div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {video?.title || 'Error'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {video?.subtitle || 'No se pudo encontrar el video'}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
      </div>
      {video?.src ? (
        <VideoPlayer className="flex-1" src={video.src} controls />
      ) : null}
    </Frame>
  );
}
