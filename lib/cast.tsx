import {
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
} from 'react';

export type CastState =
  | 'unknown'
  | 'loading'
  | 'unavailable'
  | 'no-devices-available'
  | 'not-connected'
  | 'connecting'
  | 'connected';

export interface Media {
  src: string;
  live?: boolean;
  title?: string;
  contentType?: string;
}

// https://developers.google.com/cast/docs/web_sender/integrate#framework
export class CastManager extends EventTarget {
  state: CastState = 'unknown';
  remotePlayer: any = null;
  remotePlayerController: any = null;
  media?: Media;
  mediaInfo?: any;
  activeTrackIds?: number[];
  currentTime?: number;
  isPaused?: boolean;
  friendlyName?: string;

  initialize() {
    if (this.state !== 'unknown') return;

    this.setState('loading');
    const script = document.createElement('script');
    script.src =
      'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (!isAvailable) {
        this.setState('unavailable');
        return;
      }

      this.setState('available');

      const context = cast.framework.CastContext.getInstance();

      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        // androidReceiverCompatible: false,
        androidReceiverCompatible: true,
      });

      // https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.CastContextEventType
      this.setStateFromCastState(context.getCastState());
      context.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (ev) => {
          this.setStateFromCastState(ev.castState);
        },
      );

      this.remotePlayer = new cast.framework.RemotePlayer();
      this.remotePlayerController = new cast.framework.RemotePlayerController(
        this.remotePlayer,
      );
      this.remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        () => {
          this.setState(
            this.remotePlayer.isConnected ? 'connected' : 'not-connected',
          );

          if (this.remotePlayer.isConnected) {
            if (this.media) {
              this.remotePlayer.volumeLevel = 1;
              this.remotePlayerController.setVolumeLevel();
              const mediaInfo = new chrome.cast.media.MediaInfo(
                this.media.src,
                this.media.contentType || 'application/vnd.apple.mpegurl',
              );
              mediaInfo.streamType = this.media.live
                ? chrome.cast.media.StreamType.LIVE
                : chrome.cast.media.StreamType.BUFFERED;
              mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
              mediaInfo.metadata.metadataType =
                chrome.cast.media.MetadataType.GENERIC;
              mediaInfo.metadata.title = this.media.title || 'Video';
              const request = new chrome.cast.media.LoadRequest(mediaInfo);
              cast.framework.CastContext.getInstance()
                .getCurrentSession()
                .loadMedia(request);
            }

            this.friendlyName = cast.framework.CastContext.getInstance()
              .getCurrentSession()
              .getCastDevice().friendlyName;

            this.remotePlayerController.addEventListener(
              cast.framework.RemotePlayerEventType.MEDIA_INFO_CHANGED,
              (ev) => {
                this.setMediaInfo(
                  ev.value,
                  cast.framework.CastContext.getInstance()
                    .getCurrentSession()
                    .getMediaSession()?.activeTrackIds,
                );
              },
            );

            this.remotePlayerController.addEventListener(
              cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED,
              (ev) => {
                this.setCurrentTime(ev.value);
              },
            );

            this.remotePlayerController.addEventListener(
              cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED,
              (ev) => {
                this.isPaused = ev.value;
                this.dispatchEvent(new Event('is-paused-changed'));
              },
            );
          }
        },
      );
    };

    document.body.appendChild(script);
  }

  requestSession(media: Media) {
    this.media = media;
    cast.framework.CastContext.getInstance().requestSession();
  }

  endCurrentSession(stopCasting = true) {
    this.media = undefined;
    cast.framework.CastContext.getInstance().endCurrentSession(stopCasting);
  }

  setStateFromCastState(state: any) {
    switch (state) {
      case 'NO_DEVICES_AVAILABLE':
        this.setState('no-devices-available');
        break;

      case 'NOT_CONNECTED':
        this.setState('not-connected');
        break;

      case 'CONNECTING':
        this.setState('connecting');
        break;

      case 'CONNECTED':
        this.setState('connected');
        break;
    }
  }

  setState(state: CastState) {
    this.state = state;
    this.dispatchEvent(new Event('state-changed'));
  }

  setMediaInfo(mediaInfo, activeTrackIds) {
    this.mediaInfo = mediaInfo;
    if (activeTrackIds) this.activeTrackIds = activeTrackIds;
    this.dispatchEvent(new Event('media-info-changed'));
  }

  setCurrentTime(currentTime: number) {
    this.currentTime = currentTime;
    this.dispatchEvent(new Event('current-time-changed'));
  }

  seek(currentTime: number) {
    this.remotePlayer.currentTime = currentTime;
    this.remotePlayerController.seek();
    this.setCurrentTime(currentTime);
  }

  playOrPause() {
    this.remotePlayerController.playOrPause();
  }

  stop() {
    this.remotePlayerController.stop();
  }

  setSubtitle(trackId: number) {
    const media = cast.framework.CastContext.getInstance()
      .getCurrentSession()
      .getMediaSession();
    const activeTrackIds = media.activeTrackIds.filter(
      (id) =>
        !media.media.tracks.find((t) => t.type === 'TEXT' && t.trackId == id),
    );
    if (trackId !== -1) activeTrackIds.push(trackId);

    media.editTracksInfo(
      new chrome.cast.media.EditTracksInfoRequest(activeTrackIds),
    );
  }
}

export const CastManagerContext = createContext<CastManager | null>(null);

export function useCastManager(): CastManager | null {
  return useContext(CastManagerContext);
}

export function CastManagerProvider({
  manager,
  children,
}: PropsWithChildren<{ manager: CastManager }>) {
  return (
    <CastManagerContext.Provider value={manager}>
      {children}
    </CastManagerContext.Provider>
  );
}

interface CastManagerState {
  isLoading: boolean;
  isAvailable: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnected: boolean;
  requestSession: (media: Media) => void;
  endCurrentSession: (stopCasting?: boolean) => {};
}

function getState(manager: CastManager | null): CastManagerState {
  if (!manager)
    return {
      isLoading: false,
      isAvailable: false,
      isConnecting: false,
      isConnected: false,
      isDisconnected: false,
      requestSession: () => {},
      endCurrentSession: () => {},
    };

  return {
    state: manager.state,
    isLoading: manager.state === 'unknown' || manager.state === 'loading',
    isAvailable:
      manager.state === 'not-connected' ||
      manager.state === 'connecting' ||
      manager.state === 'connected',
    isConnecting: manager.state === 'connecting',
    isConnected: manager.state === 'connected',
    isDisconnected: manager.state === 'not-connected',
    requestSession: (media: Media) => manager.requestSession(media),
    endCurrentSession: (stopCasting = true) =>
      manager.endCurrentSession(stopCasting),
  };
}

export function useCast(): CastManagerState {
  const manager = useCastManager();
  const [state, setState] = useState(() => getState(manager));

  useEffect(() => {
    if (!manager) return;
    manager.initialize();

    const handler = () => {
      setState(getState(manager));
    };

    manager.addEventListener('state-changed', handler);

    return () => {
      manager.removeEventListener('state-changed', handler);
    };
  }, [manager]);

  return state;
}

export function useMedia() {
  const manager = useCastManager();
  const [state, setState] = useState(() => ({
    mediaInfo: manager.mediaInfo,
    activeTrackIds: manager.activeTrackIds,
    currentTime: manager.currentTime,
    seek: (currentTime: number) => {
      manager.seek(currentTime);
    },
    playOrPause: () => {
      manager.playOrPause();
    },
    isPaused: manager.isPaused,
    stop: () => manager.stop(),
    setSubtitle: (trackId: number) => manager.setSubtitle(trackId),
    friendlyName: manager.friendlyName,
  }));
  useEffect(() => {
    if (!manager) return;
    const handleMediaInfoChanged = () => {
      setState((s) => ({
        ...s,
        mediaInfo: manager.mediaInfo,
        activeTrackIds: manager.activeTrackIds,
      }));
    };
    const handleCurrentTimeChanged = () => {
      setState((s) => ({
        ...s,
        currentTime: manager.currentTime,
      }));
    };
    const handleIsPausedChanged = () => {
      setState((s) => ({
        ...s,
        isPaused: manager.isPaused,
      }));
    };

    manager.addEventListener('media-info-changed', handleMediaInfoChanged);
    manager.addEventListener('current-time-changed', handleCurrentTimeChanged);
    manager.addEventListener('is-paused-changed', handleIsPausedChanged);

    return () => {
      manager.removeEventListener('media-info-changed', handleMediaInfoChanged);
      manager.removeEventListener(
        'current-time-changed',
        handleCurrentTimeChanged,
      );
      manager.removeEventListener('is-paused-changed', handleIsPausedChanged);
    };
  }, [manager]);
  return state;
}
