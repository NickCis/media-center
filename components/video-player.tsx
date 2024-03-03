'use client';

import { type VideoHTMLAttributes } from 'react';
import Hls, {
  type LoaderContext,
  type LoaderConfiguration,
  type LoaderCallbacks,
} from 'hls.js';
import { useRef, useEffect } from 'react';
import {
  PersistentStorage,
  usePersistentStorage,
} from '@/lib/persistent-storage';
import { MegaDownloader, withMegaDownloader, UseMegaJs } from '@/lib/mega';

// type = - just to fix highlight in vim

export type VideoPlayerProps = VideoHTMLAttributes<HTMLVideoElement>;

// https://github.com/video-dev/hls.js/blob/master/docs/API.md#loader
// https://github.com/video-dev/hls.js/blob/master/docs/API.md#creating-a-custom-loader
function withStorage(
  persistentStorage: PersistentStorage,
  Loader = Hls.DefaultConfig.loader,
) {
  const stubStats = {
    aborted: false,
    loaded: 0,
    retry: 0,
    total: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: { start: 0, first: 0, end: 0 },
    parsing: { start: 0, end: 0 },
    buffering: { start: 0, first: 0, end: 0 },
  };
  return class PersistentStorageLoader extends Loader {
    async load(
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>,
    ) {
      let { responseType, url } = context;
      const file = await persistentStorage.getFile(url);

      // If stats is null, it means that the loader was destroyed
      if (!this.stats) return;

      if (file) {
        switch (responseType) {
          case 'text': {
            const text = await file.blob.text();
            callbacks.onSuccess(
              {
                code: 200,
                url,
                data: text,
              },
              this.stats,
              context,
              { responseText: text },
            );
            break;
          }

          case 'arraybuffer':
            callbacks.onSuccess(
              {
                code: 200,
                url,
                data: await file.blob.arrayBuffer(),
              },
              this.stats,
              context,
              {},
            );
            break;

          default:
            console.log(`reponseType '{responseType}' not supported`);
            break;
        }
        return;
      }

      super.load(context, config, callbacks);
    }
  };
}

export function VideoPlayer({ src, ...props }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const persistentStorage = usePersistentStorage();
  const storageRef = useRef(persistentStorage);
  storageRef.current = persistentStorage;

  useEffect(() => {
    if (!src) return;

    const video = ref.current;
    if (!video) return;

    if (Hls.isSupported()) {
      let cancel = false;
      let cleanup: () => void;

      (async () => {
        let loader: typeof Hls.DefaultConfig.loader = UseMegaJs
          ? withMegaDownloader(new MegaDownloader())
          : Hls.DefaultConfig.loader;
        if (storageRef.current)
          loader = withStorage(storageRef.current, loader);
        const hls = new Hls(loader ? { loader } : {});
        cleanup = () => {
          hls.destroy();
        };
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
        hls.attachMedia(video);
        hls.loadSource(src);
      })();

      return () => {
        cancel = true;
        video.pause();
        if (cleanup) cleanup();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  }, [src]);

  return <video ref={ref} {...props} />;
}
