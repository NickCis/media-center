'use client';

import { useMemo } from 'react';
import {
  Download as DownloadIcon,
  Cuboid as CuboidIcon,
  X as XIcon,
  CircleDashed as CircleDashedIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Frame } from '@/components/frame';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { atob } from '@/lib/base64';
import { useHLSStorage } from '@/lib/persistent-storage';

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

function Bar({ src }: { src?: string }) {
  const hls = useHLSStorage(src);
  if ('download' in hls && 'progress' in hls) {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" className="py-1 h-auto" disabled>
          {hls.progress.toFixed(2)}%
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="py-1 h-auto"
                onClick={() => hls.download()}
                size="icon"
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="py-1 h-auto" size="icon">
              <XIcon className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will erase the media from the device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => hls.delete()}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if ('download' in hls) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="py-1 h-auto"
              onClick={() => hls.download()}
              size="icon"
            >
              <DownloadIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if ('progress' in hls) {
    return (
      <Button variant="outline" className="py-1 h-auto" disabled>
        {hls.progress.toFixed(2)}%
      </Button>
    );
  }

  return (
    <Button variant="outline" className="py-1 h-auto" disabled>
      <CircleDashedIcon className="animate-spin" />
    </Button>
  );
}

export default function Player({ params }: PlayerProps) {
  const video = usePlayerProps(params.data);
  const hls = useHLSStorage(video?.src);

  return (
    <Frame classes={{ inner: 'flex flex-col' }}>
      <div>
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {video?.title || 'Error'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {video?.subtitle || 'No se pudo encontrar el video'}
            </p>
          </div>
          <Bar src={video?.src} />
        </div>
        <Separator className="my-4" />
      </div>
      <div className="flex-1">
        {video?.src ? (
          <VideoPlayer
            src={video.src}
            className="max-h-full min-w-full object-cover"
            controls
          />
        ) : null}
      </div>
    </Frame>
  );
}
