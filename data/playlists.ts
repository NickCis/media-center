'use client';

import {
  useQuery,
  useQueries,
  useQueryClient,
  useMutation,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { PlaylistEntry, Source } from '@/interfaces/playlist';

// https://jsonbin.io/

const PlaylistSourcesKey = '__media-center__playist-sources__';

export async function getPlaylistSources(): Promise<Source[]> {
  try {
    return JSON.parse(localStorage.getItem(PlaylistSourcesKey) || '') || [];
  } catch (e) {}
  return [];
}

export function usePlaylistSources() {
  return useQuery({
    queryKey: ['playlist-sources'],
    queryFn: getPlaylistSources,
  });
}

export function updatePlaylistSources(sources: Source[]) {
  localStorage.setItem(PlaylistSourcesKey, JSON.stringify(sources));
}

export function useUpdatePlaylistSources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sources: Source[]) => {
      return await updatePlaylistSources(sources);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-sources'] });
    },
  });
}

export function useAddPlaylistSource() {
  const queryClient = useQueryClient();
  const { data: sources } = usePlaylistSources();

  return useMutation({
    mutationFn: async (source: Source) => {
      if (sources && sources.find((s) => s.src === source.src))
        throw new Error('Playlist already exists in library');

      await getPlaylist(source);

      return await updatePlaylistSources([...(sources || []), source]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-sources'] });
    },
  });
}

export function useUpdatePlaylistSource() {
  const queryClient = useQueryClient();
  const { data: sources } = usePlaylistSources();

  return useMutation({
    mutationFn: async (source: Source) => {
      if (!sources || !sources.find((s) => s.src === source.src))
        throw new Error("Playlist doesn't exist in library");

      await getPlaylist(source);

      return await updatePlaylistSources(
        sources.map((src) => {
          if (src.src === source.src) return source;
          return src;
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-sources'] });
    },
  });
}

export function useRemovePlaylistSource() {
  const queryClient = useQueryClient();
  const { data: sources } = usePlaylistSources();

  return useMutation({
    mutationFn: async (source: Source) => {
      if (!sources || !sources.find((s) => s.src === source.src))
        throw new Error("Playlist doesn't exist in library");

      return await updatePlaylistSources(
        sources.filter((s) => s.src !== source.src),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-sources'] });
    },
  });
}

export async function getPlaylist(src: Source): Promise<PlaylistEntry> {
  const res = await fetch(src.src);
  if (!res.ok) throw new Error('Network error');

  // TODO: validate
  return {
    ...src,
    entries: (await res.json())?.record as PlaylistEntry['entries'],
  };
}

export function usePlaylists(): UseQueryResult<PlaylistEntry>[] {
  const { data: playlistsSrc } = usePlaylistSources();

  return useQueries({
    queries: playlistsSrc
      ? playlistsSrc.map((src) => ({
          queryKey: ['playlists', src.src],
          queryFn: async () => {
            return await getPlaylist(src);
          },
        }))
      : [],
  });
}
