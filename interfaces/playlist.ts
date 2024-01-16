export interface VideoEntry {
  title: string;
  subtitle: string;
  cover: string;
  src: string;
}

export interface VideoSubSectionEntry {
  title: string;
  entries: VideoEntry[];
}

export interface VideoSectionEntry {
  title: string;
  entries: VideoSubSectionEntry[];
}

export interface Source {
  name: string;
  type: 'jsonbin';
  src: string;
}

export interface PlaylistEntry extends Source {
  entries: VideoSectionEntry[];
}
