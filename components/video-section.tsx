import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollBar } from '@/components/ui/scroll-area';
import { VideoItem } from './video-item';
import { Button, type ButtonProps } from '@/components/ui/button';
import { SymbolIcon } from '@radix-ui/react-icons';
import type { VideoEntry, VideoSubSectionEntry } from '@/interfaces/playlist';

interface VideoSubSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  entries: VideoEntry[];
}

export function VideoSubSection({ title, entries }: VideoSubSectionProps) {
  return (
    <>
      <h3 className="mt-2 text-sm text-muted-foreground">{title}</h3>
      <Separator className="mt-1 mb-4" />
      <div className="relative">
        <ScrollArea>
          <div className="flex space-x-4 pb-4">
            {entries.map((video) => (
              <VideoItem
                key={video.src}
                video={video}
                className="w-[150px]"
                aspectRatio="square"
                width={150}
                height={150}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
}

interface VideoSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  entries: VideoSubSectionEntry[];
  onRefreshClick?: ButtonProps['onClick'];
}

export function VideoSection({
  className,
  title,
  entries,
  onRefreshClick,
}: VideoSectionProps) {
  return (
    <div className={className}>
      <div className="flex">
        <h2 className="text-2xl font-semibold tracking-tight flex-1">
          {title}
        </h2>
        <Button
          variant="outline"
          className="py-1 h-auto"
          onClick={onRefreshClick}
        >
          <SymbolIcon />
        </Button>
      </div>
      {entries.map(({ title, entries }, index) => (
        <VideoSubSection key={index} title={title} entries={entries} />
      ))}
    </div>
  );
}
