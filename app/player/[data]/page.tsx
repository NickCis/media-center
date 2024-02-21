'use client';

import { useMemo, useState } from 'react';
import {
  Download as DownloadIcon,
  Cuboid as CuboidIcon,
  X as XIcon,
  CircleDashed as CircleDashedIcon,
  Cast as CastIcon,
  Loader2 as Loader2Icon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as SquareIcon,
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { atob } from '@/lib/base64';
import { useHLSStorage } from '@/lib/persistent-storage';
import { useCast, useMedia } from '@/lib/cast';

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

function getMediaTimeString(timestamp?: number | null): string {
  if (timestamp == undefined || timestamp == null) return null;

  let isNegative = false;
  if (timestamp < 0) {
    isNegative = true;
    timestamp *= -1;
  }

  let hours = Math.floor(timestamp / 3600);
  let minutes = Math.floor((timestamp - hours * 3600) / 60);
  let seconds = Math.floor(timestamp - hours * 3600 - minutes * 60);

  if (hours < 10) hours = '0' + hours;
  if (minutes < 10) minutes = '0' + minutes;
  if (seconds < 10) seconds = '0' + seconds;

  return (isNegative ? '-' : '') + hours + ':' + minutes + ':' + seconds;
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
      <CircleDashedIcon className="h-4 w-4 animate-spin" />
    </Button>
  );
}

function CastController() {
  const {
    friendlyName,
    mediaInfo,
    currentTime,
    isPaused,
    seek,
    playOrPause,
    stop,
    setSubtitle,
    activeTrackIds,
  } = useMedia();
  const [slider, setSlider] = useState<number | undefined>();
  const subtitleTracks = (mediaInfo?.tracks || []).filter(
    (t) => t.type === 'TEXT',
  );

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {mediaInfo?.metadata?.title || 'Video'} in &apos;{friendlyName}&apos;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Slider
            value={[(slider !== undefined ? slider : currentTime) || 0]}
            min={0}
            max={mediaInfo?.duration || 0}
            onValueChange={(ev) => {
              setSlider(ev[0]);
            }}
            onValueCommit={(ev) => {
              const value = ev[0];
              seek(value);
              setSlider(undefined);
            }}
          />
        </div>
      </CardContent>
      <CardFooter>
        <span className="text-sm text-muted-foreground font-mono">
          {getMediaTimeString(currentTime)}
        </span>
        <div className="flex-1 flex justify-center space-x-1">
          <Button variant="ghost" size="icon" onClick={() => playOrPause()}>
            {isPaused ? (
              <PlayIcon className="h-4 w-4" />
            ) : (
              <PauseIcon className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => stop()}>
            <SquareIcon className="h-4 w-4" />
          </Button>
        </div>
        {subtitleTracks?.length > 0 ? (
          <div className="mr-2">
            <Select
              onValueChange={(ev) => {
                const value = parseInt(ev, 10);
                setSubtitle(value);
              }}
              value={
                subtitleTracks.find(
                  ({ trackId }) => activeTrackIds?.includes(trackId),
                )?.trackId ?? -1
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Subtitle" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Subtitle</SelectLabel>
                  <SelectItem value={-1}>No Subtitle</SelectItem>
                  {subtitleTracks.map((s) => (
                    <SelectItem key={s.trackId} value={s.trackId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <span className="text-sm text-muted-foreground font-mono">
          {getMediaTimeString(mediaInfo?.duration || 0)}
        </span>
      </CardFooter>
    </Card>
  );
}

export default function Player({ params }: PlayerProps) {
  const video = usePlayerProps(params.data);
  const hls = useHLSStorage(video?.src);
  const castState = useCast();

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
          {castState.isAvailable ? (
            <Button
              variant="outline"
              className="ml-2 py-1 h-auto relative"
              size="icon"
              disabled={castState.isConnecting}
              onClick={() => {
                if (video && castState.isDisconnected) {
                  castState.requestSession({
                    src: video?.src,
                    title: video.title,
                  });
                  return;
                }

                if (castState.isConnected) {
                  castState.endCurrentSession();
                  return;
                }
              }}
            >
              <CastIcon
                className={cn(
                  'h-4 w-4',
                  castState.isConnected && 'text-blue-500',
                )}
              />
              {castState.isConnecting ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              ) : null}
            </Button>
          ) : null}
        </div>
        <Separator className="my-4" />
      </div>
      <div className="flex-1">
        {castState.isConnected ? (
          <CastController />
        ) : video?.src ? (
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
