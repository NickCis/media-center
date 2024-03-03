import { File } from 'megajs';
import Hls, {
  type LoaderContext,
  type LoaderConfiguration,
  type LoaderCallbacks,
} from 'hls.js';

// type = - just to fix highlight in vim

export const UseMegaJs = false;

export function isMegaLink(src: string): boolean {
  const cleaned = src.trim().toLowerCase();
  if (
    cleaned.startsWith('https://mega.nz/') ||
    cleaned.startsWith('https://mega.co.nz/')
  )
    return true;
  if (cleaned.startsWith('mega://')) return true;
  if (cleaned.startsWith('https://mega-next.vercel.app/')) return true;

  return false;
}

export class MegaDownloader {
  cache: Record<string, Promise<File>> = {};

  async loadFolderWithAttributes(
    downloadId: string,
    key: string,
  ): Promise<File> {
    const folder = new File({
      downloadId,
      key,
      directory: true,
    });

    await folder.loadAttributes();

    return folder;
  }

  async fetchFolder(downloadId: string, key: string): Promise<File> {
    if (!this.cache[downloadId])
      this.cache[downloadId] = this.loadFolderWithAttributes(downloadId, key);

    return await this.cache[downloadId];
  }

  async fetch(src: string): Promise<Uint8Array> {
    const cleaned = src.trim().toLowerCase();
    if (
      cleaned.startsWith('https://mega.nz/') ||
      cleaned.startsWith('https://mega.co.nz/')
    ) {
      const file = File.fromURL(src);
      return await file.downloadBuffer({ maxConnections: 1 });
    }

    const match = src.match(
      /^(mega:\/|https:\/\/mega-next.vercel.app)\/([^:]+):([^/]+)(\/.*?)$/i,
    );
    if (match) {
      const [, , downloadId, key, path] = match;
      if (!path) {
        const file = File.fromURL(`https://mega.nz/file/${downloadId}#${key}`);
        return await file.downloadBuffer({ maxConnections: 1 });
      }

      const folder = await this.fetchFolder(downloadId, key);
      const [, ...rest] = path.split('/'); // it starts with a `/`
      const recursiveSearch = (
        folder: File | undefined,
        path: string[],
      ): File | undefined => {
        if (!folder?.children) return;

        const [current, ...rest] = path;
        const file = folder.children.find((f) => f.name === current);
        return rest.length > 0 ? recursiveSearch(file, rest) : file;
      };
      const file = recursiveSearch(folder, rest);

      if (file) return await file.downloadBuffer({ maxConnections: 1 });
    }

    throw new Error(`Invalid mega url: ${src}`);
  }
}

export function withMegaDownloader(
  downloader: MegaDownloader,
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
  return class MegaDownloader extends Loader {
    async load(
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>,
    ) {
      let { responseType, url } = context;
      if (isMegaLink(url)) {
        try {
          const arr = await downloader.fetch(url);
          // If stats is null, it means that the loader was destroyed
          if (!this.stats) return;

          if (arr) {
            const blob = new Blob([arr]);

            switch (responseType) {
              case 'text': {
                const text = await blob.text();
                callbacks.onSuccess(
                  {
                    code: 200,
                    url,
                    data: text,
                  },
                  this.stats,
                  context,
                  {
                    responseText: text,
                  },
                );
                break;
              }

              case 'arraybuffer':
                callbacks.onSuccess(
                  {
                    code: 200,
                    url,
                    data: await blob.arrayBuffer(),
                  },
                  this.stats,
                  context,
                  {},
                );
                break;

              default:
                console.error(`reponseType '{responseType}' not supported`);
                break;
            }

            return;
          }
        } catch (e) {
          console.error(e);
        }

        return;
      }

      super.load(context, config, callbacks);
    }
  };
}
