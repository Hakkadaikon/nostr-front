"use client";

import { useEffect } from 'react';
import { parseMediaUrl } from '../../lib/utils/media-urls';
import { EmbeddedImage, EmbeddedVideo } from './EmbeddedMedia';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
import { XEmbed } from './embeds/XEmbed';
import { SpotifyEmbed } from './embeds/SpotifyEmbed';
import { ApplePodcastsEmbed } from './embeds/ApplePodcastsEmbed';
import { SoundCloudEmbed } from './embeds/SoundCloudEmbed';
import { VimeoEmbed } from './embeds/VimeoEmbed';
import { TikTokEmbed } from './embeds/TikTokEmbed';
import { TwitchEmbed } from './embeds/TwitchEmbed';
import { AudioEmbed } from './embeds/AudioEmbed';
import { LinkPreview } from './LinkPreview';

interface MediaEmbedProps {
  url: string;
  authorPubkey?: string;
}

export function MediaEmbed({ url, authorPubkey }: MediaEmbedProps) {
  const mediaInfo = parseMediaUrl(url);

  // 埋め込み処理のログ出力
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [url, mediaInfo]);

  switch (mediaInfo.platform) {
    case 'youtube':
      return mediaInfo.embedUrl && mediaInfo.mediaId ? (
        <YouTubeEmbed videoId={mediaInfo.mediaId} url={url} />
      ) : <LinkPreview url={url} />;

    case 'x':
    case 'twitter':
      return mediaInfo.mediaId ? (
        <XEmbed statusId={mediaInfo.mediaId} url={url} />
      ) : <LinkPreview url={url} />;

    case 'spotify':
      return mediaInfo.embedUrl ? (
        <SpotifyEmbed embedUrl={mediaInfo.embedUrl} url={url} />
      ) : <LinkPreview url={url} />;

    case 'apple-podcasts':
      return mediaInfo.embedUrl ? (
        <ApplePodcastsEmbed embedUrl={mediaInfo.embedUrl} url={url} />
      ) : <LinkPreview url={url} />;

    case 'soundcloud':
      return mediaInfo.embedUrl ? (
        <SoundCloudEmbed embedUrl={mediaInfo.embedUrl} url={url} />
      ) : <LinkPreview url={url} />;

    case 'vimeo':
      return mediaInfo.mediaId ? (
        <VimeoEmbed videoId={mediaInfo.mediaId} url={url} />
      ) : <LinkPreview url={url} />;

    case 'tiktok':
      return <TikTokEmbed url={url} />;

    case 'twitch':
      return mediaInfo.embedUrl ? (
        <TwitchEmbed embedUrl={mediaInfo.embedUrl} url={url} type={mediaInfo.embedUrl.includes('clip') ? 'clip' : 'video'} />
      ) : <LinkPreview url={url} />;

    case 'image':
      return <EmbeddedImage url={url} authorPubkey={authorPubkey} />;

    case 'video':
      return <EmbeddedVideo url={url} />;

    case 'audio':
      return <AudioEmbed url={url} />;

    default:
      return <LinkPreview url={url} />;
  }
}