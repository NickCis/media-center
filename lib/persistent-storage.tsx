'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type PropsWithChildren,
} from 'react';
import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from 'idb';
import Hls from 'hls.js';

interface MediaFileGeneric {
  type: 'playlist' | 'video' | 'vtt';
  href: string;
  blob: Blob;
  playlist: string;
}

interface MediaFileMaster {
  href: string;
  blob: Blob;
  playlist: string;
  type: 'master-playlist';
  total: number;
  current: number;
}

type MediaFile = MediaFileGeneric | MediaFileMaster;

type FileType = MediaFile['type'];

interface MediaCenterDB extends DBSchema {
  files: {
    value: MediaFile;
    key: string;
    indexes: {
      'by-type': FileType;
      'by-playlist': string;
    };
  };
}

const ObjectStore = {
  Files: 'files' as const,
};

function newPromise(): { resolve: () => void; promise: Promise<void> } {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((rs) => {
    resolve = rs;
  });

  return {
    resolve,
    promise,
  };
}

class HLSDownloader extends EventTarget {
  persistentStorage: PersistentStorage;
  total = 0;
  current = 0;
  runners = 5;
  pending: (Omit<MediaFileGeneric, 'blob'> & { start: number })[] = [];

  constructor(persistentStorage: PersistentStorage) {
    super();
    this.persistentStorage = persistentStorage;
  }

  download(href: string) {
    const hls = new Hls();
    let i = 0;
    const levelPromise = newPromise();
    const subtitlePromise = newPromise();

    const downloadSubtitleTrack = () => {
      const track = hls.subtitleTracks[i++];
      if (!track) {
        subtitlePromise.resolve();
        return;
      }
      const subtitleTrackController = hls['subtitleTrackController'];

      const { id, groupId = '', name, type, url } = track;
      hls.trigger(Hls.Events.SUBTITLE_TRACK_SWITCH, {
        id,
        groupId,
        name,
        type,
        url,
      });
      const hlsUrlParameters = subtitleTrackController.switchParams(track.url);
      // subtitleTrackController.loadPlaylist(hlsUrlParameters);
      hls.trigger(Hls.Events.SUBTITLE_TRACK_LOADING, {
        url: hlsUrlParameters ? hlsUrlParameters.addDirectives(url) : url,
        id,
        groupId,
        deliveryDirectives: hlsUrlParameters || null,
      });
    };

    hls.on(Hls.Events.MANIFEST_LOADED, async (event, data) => {
      const mediaFile = {
        // href: data.networkDetails.responseURL,
        href: data.url,
        playlist: href,
        type: 'master-playlist' as const,
        blob: new Blob([data.networkDetails.responseText], {
          type: 'application/vnd.apple.mpegurl',
        }),
        current: 0,
        total: 0,
      };
      await this.persistentStorage.storeFile(mediaFile);
      downloadSubtitleTrack();

      const handleProgress = () => {
        mediaFile.current = this.current;
        mediaFile.total = this.total;
        if (mediaFile.current % 10 === 0)
          this.persistentStorage.storeFile(mediaFile);
      };

      const handleFinished = () => {
        this.removeEventListener('progress', handleProgress);
        this.removeEventListener('finished', handleFinished);

        mediaFile.current = this.current;
        mediaFile.total = this.total;
        this.persistentStorage.storeFile(mediaFile);
      };

      this.addEventListener('progress', handleProgress);
      this.addEventListener('finished', handleFinished);
    });

    hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, async (event, data) => {
      const details = data.details;
      const subtitlePlaylist = {
        href: details.url,
        playlist: href,
        type: 'playlist' as const,
        blob: new Blob([details.m3u8], {
          type: 'application/vnd.apple.mpegurl',
        }),
      };
      this.persistentStorage.storeFile(subtitlePlaylist);

      for (const fragment of details.fragments) {
        const url = fragment.url;
        this.enqueue({
          href: url,
          playlist: href,
          type: 'vtt' as const,
          start: fragment.start,
        });
      }

      downloadSubtitleTrack();
    });

    hls.on(Hls.Events.LEVEL_LOADED, async (event, data) => {
      const details = data.details;
      const levelFile = {
        href: details.url,
        playlist: href,
        type: 'playlist' as const,
        blob: new Blob([details.m3u8], {
          type: 'application/vnd.apple.mpegurl',
        }),
      };

      this.persistentStorage.storeFile(levelFile);

      for (const fragment of details.fragments) {
        const url = fragment.url;
        this.enqueue({
          href: url,
          playlist: href,
          type: 'video',
          start: fragment.start,
        });
      }
      levelPromise.resolve();
    });

    hls.loadSource(href);

    Promise.all([levelPromise.promise, subtitlePromise.promise]).then(() => {
      this.pending.sort((a, b) => (a.start || 0) - (b.start || 0));
      hls.destroy();
    });
  }

  async downloadFile(
    media: Omit<MediaFileGeneric, 'blob'>,
    retry = 5,
  ): Promise<void> {
    const exists = !!(await this.persistentStorage.getFile(media.href));
    if (!exists) {
      const res = await fetch(media.href);
      if (res.ok) {
        await this.persistentStorage.storeFile({
          ...media,
          blob: await res.blob(),
        });
      } else if (retry > 0) {
        return await this.downloadFile(media, retry - 1);
      } else {
        // TODO: add data
        this.dispatchEvent(new Event('error'));
      }
    }

    this.current++;
    this.dispatchEvent(new Event('progress'));

    const next = this.pending.shift();
    if (next) {
      this.downloadFile(next);
    } else {
      this.runners++;
      if (this.current === this.total)
        this.dispatchEvent(new Event('finished'));
    }
  }

  enqueue(media: Omit<MediaFileGeneric, 'blob'> & { start: number }) {
    this.total++;
    if (this.runners > 0) {
      this.runners--;
      this.downloadFile(media);
    } else {
      this.pending.push(media);
    }
  }
}

export class PersistentStorage {
  db: Promise<IDBPDatabase<MediaCenterDB>> | null = null;
  currentDownloads: Record<string, HLSDownloader> = {};

  _getDB(): Promise<IDBPDatabase<MediaCenterDB>> {
    return openDB<MediaCenterDB>('media-center-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ObjectStore.Files)) {
          const fileStore = db.createObjectStore(ObjectStore.Files, {
            keyPath: 'href',
          });

          fileStore.createIndex('by-type', 'type');
          fileStore.createIndex('by-playlist', 'playlist');
        }
      },
    });
  }

  async getDB(): Promise<IDBPDatabase<MediaCenterDB>> {
    if (!this.db) this.db = this._getDB();

    return await this.db;
  }

  async storeFile(file: MediaFile) {
    const db = await this.getDB();
    await db.put(ObjectStore.Files, file);
  }

  async getFile(href: string) {
    const db = await this.getDB();
    return await db.get(ObjectStore.Files, href);
  }

  storeHLS(href: string) {
    if (!this.currentDownloads[href]) {
      this.currentDownloads[href] = new HLSDownloader(this);
      const l = () => {
        this.currentDownloads[href].removeEventListener('finished', l);
        delete this.currentDownloads[href];
      };
      this.currentDownloads[href].addEventListener('finished', l);
      this.currentDownloads[href].download(href);
    }

    return this.currentDownloads[href];
  }

  async deleteHLS(href: string) {
    const db = await this.getDB();
    const keys = await db.getAllKeysFromIndex(
      ObjectStore.Files,
      'by-playlist',
      href,
    );
    const tx = db.transaction(ObjectStore.Files, 'readwrite');
    await Promise.all([...keys.map((k) => tx.store.delete(k)), tx.done]);
  }

  async runConsistencyChecker() {
    const db = await this.getDB();

    try {
      const tx = db.transaction(ObjectStore.Files);
      const playlists = new Set<string>();
      for await (const cursor of tx.store) {
        playlists.add(cursor.value.playlist);
      }

      for (const playlist of Array.from(playlists)) {
        const exists = !!(await this.getFile(playlist));
        if (!exists) await this.deleteHLS(playlist);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      for (const key of await db.getAllKeysFromIndex(
        ObjectStore.Files,
        'by-type',
        'master-playlist',
      )) {
        const file = await this.getFile(key);
        if (
          file &&
          file.type === 'master-playlist' &&
          file.total !== file.current
        )
          await this.storeHLS(key);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export const PersistentStorageContext = createContext<PersistentStorage | null>(
  null,
);

export function usePersistentStorage(): PersistentStorage | null {
  return useContext(PersistentStorageContext);
}

export type UseHLSStorageBag =
  | {}
  | { current: number; total: number; progress: number }
  | { download: () => void }
  | {
      download: () => void;
      current: number;
      total: number;
      progress: number;
      delete: () => void;
    };

export function useHLSStorage(href?: string): UseHLSStorageBag {
  const [state, setState] = useState<UseHLSStorageBag>({});
  const persistentStorage = usePersistentStorage();
  const [key, setKey] = useState(1);

  useEffect(() => {
    if (!persistentStorage || !href) return;
    const downloader = persistentStorage.currentDownloads[href];
    if (downloader) {
      const p = () => {
        setState({
          current: downloader.current,
          total: downloader.total,
          progress: downloader.total
            ? (downloader.current * 100) / downloader.total
            : 0,
        });
      };
      const f = () => {
        setKey((k) => k + 1);
      };
      p();

      downloader.addEventListener('progress', p);
      downloader.addEventListener('finished', f);

      return () => {
        downloader.removeEventListener('progress', p);
        downloader.removeEventListener('finished', f);
      };
    }

    let clean: () => void;
    let cancel = false;
    (async () => {
      const state = {
        download: () => {
          const downloader = persistentStorage.storeHLS(href);
          const l = () => {
            setState({
              current: downloader.current,
              total: downloader.total,
              progress: downloader.total
                ? (downloader.current * 100) / downloader.total
                : 0,
            });
          };
          const f = () => {
            setKey((k) => k + 1);
          };
          downloader.addEventListener('progress', l);
          downloader.addEventListener('finished', f);
          clean = () => {
            downloader.removeEventListener('progress', l);
            downloader.removeEventListener('finished', f);
          };
        },
        delete: async () => {
          setState({});
          await persistentStorage.deleteHLS(href);
          if (cancel) return;
          setKey((k) => k + 1);
        },
      };

      const file = await persistentStorage.getFile(href);
      if (file?.type === 'master-playlist') {
        Object.assign(state, {
          current: file.current,
          total: file.total,
          progress: file.total ? (file.current * 100) / file.total : 0,
        });
      }

      setState(state);
    })();

    return () => {
      cancel = true;
      if (clean) clean();
    };
  }, [href, persistentStorage, key]);

  return state;
}

export function PersistentStorageProvider({
  persistentStorage,
  children,
}: PropsWithChildren<{ persistentStorage: PersistentStorage }>) {
  const ref = useRef(false);
  useEffect(() => {
    if (!persistentStorage) return;
    if (ref.current) return;
    ref.current = true;
    // Clean
    persistentStorage.runConsistencyChecker();
  }, [persistentStorage]);

  return (
    <PersistentStorageContext.Provider value={persistentStorage}>
      {children}
    </PersistentStorageContext.Provider>
  );
}
