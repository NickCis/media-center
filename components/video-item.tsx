import { useMemo } from 'react';
// import Image from 'next/image';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { btoa } from '@/lib/base64';

import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import type { VideoEntry } from '@/interfaces/playlist';

interface VideoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  video: VideoEntry;
  aspectRatio?: 'portrait' | 'square';
  width?: number;
  height?: number;
}

function useHref(entry: VideoEntry): string {
  return useMemo(() => {
    const data = btoa(
      JSON.stringify({
        title: entry.title,
        subtitle: entry.subtitle,
        src: entry.src,
      }),
    );
    return `/player/${encodeURIComponent(data)}`;
  }, [entry]);
}

export function VideoItem({
  video,
  aspectRatio = 'portrait',
  width,
  height,
  className,
  ...props
}: VideoItemProps) {
  const href = useHref(video);
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="overflow-hidden rounded-md">
            <Link href={href}>
              <img
                src={video.cover}
                alt={video.title}
                width={width}
                height={height}
                className={cn(
                  'h-auto w-auto object-cover transition-all hover:scale-105',
                  aspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square',
                )}
              />
            </Link>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem>Add to Library</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Play Next</ContextMenuItem>
          <ContextMenuItem>Play Later</ContextMenuItem>
          <ContextMenuItem>Create Station</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Like</ContextMenuItem>
          <ContextMenuItem>Share</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <div className="space-y-1 text-sm">
        <Link href={href}>
          <h3 className="font-medium leading-none truncate" title={video.title}>
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground">{video.subtitle}</p>
        </Link>
      </div>
    </div>
  );
}
