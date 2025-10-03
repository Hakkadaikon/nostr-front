"use client";

import { parseMediaUrl } from '../../lib/utils/media-urls';
import { EmbeddedImage, EmbeddedVideo } from './EmbeddedMedia';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
import { XEmbed } from './embeds/XEmbed';
import { SpotifyEmbed } from './embeds/SpotifyEmbed';
import { ApplePodcastsEmbed } from './embeds/ApplePodcastsEmbed';
import { LinkPreview } from './LinkPreview';

interface MediaEmbedProps {
  url: string;
}

export function MediaEmbed({ url }: MediaEmbedProps) {
  const mediaInfo = parseMediaUrl(url);

  switch (mediaInfo.platform) {
    case 'youtube':
      return mediaInfo.embedUrl && mediaInfo.mediaId ? (
        <YouTubeEmbed videoId={mediaInfo.mediaId} url={url} />
      ) : null;

    case 'x':
    case 'twitter':
      return mediaInfo.mediaId ? (
        <XEmbed statusId={mediaInfo.mediaId} url={url} />
      ) : null;

    case 'spotify':
      return mediaInfo.embedUrl ? (
        <SpotifyEmbed embedUrl={mediaInfo.embedUrl} url={url} />
      ) : null;

    case 'apple-podcasts':
      return mediaInfo.embedUrl ? (
        <ApplePodcastsEmbed embedUrl={mediaInfo.embedUrl} url={url} />
      ) : null;

    case 'image':
      return <EmbeddedImage url={url} />;

    case 'video':
      return <EmbeddedVideo url={url} />;

    default:
      return <LinkPreview url={url} />;
  }
}