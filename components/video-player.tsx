'use client';

import { type VideoHTMLAttributes } from 'react';
import Hls from 'hls.js';
import { useRef, useEffect } from 'react';

export type VideoPlayerProps = VideoHTMLAttributes<HTMLVideoElement>;

export function VideoPlayer({ src, ...props }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!src) return;

    const video = ref.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  }, [src]);

  return <video ref={ref} {...props} />;
}
