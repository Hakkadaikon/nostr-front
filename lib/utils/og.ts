interface OgMetadata {
  url?: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

const META_TAG_REGEX = /<meta\s+[^>]*>/gi;
const TITLE_REGEX = /<title[^>]*>(.*?)<\/title>/i;
const ATTRIBUTE_REGEX = /(\w[\w:-]*)\s*=\s*"([^"]*)"|(\w[\w:-]*)\s*=\s*'([^']*)'|(\w[\w:-]*)\s*=\s*([^\s"'>]+)/g;

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = ATTRIBUTE_REGEX.exec(tag))) {
    const key = match[1] || match[3] || match[5];
    const value = match[2] || match[4] || match[6] || '';
    if (key) {
      attributes[key.toLowerCase()] = value;
    }
  }
  return attributes;
}

export function extractOgMetadata(html: string): OgMetadata {
  const metadata: OgMetadata = {};

  const titleMatch = html.match(TITLE_REGEX);
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1].trim();
  }

  const metaTags = html.match(META_TAG_REGEX) || [];
  for (const tag of metaTags) {
    const attrs = parseAttributes(tag);
    const property = attrs['property'] || attrs['name'];
    const content = attrs['content'];
    if (!property || !content) continue;

    switch (property.toLowerCase()) {
      case 'og:title':
        metadata.title = content;
        break;
      case 'og:description':
      case 'description':
        if (!metadata.description) metadata.description = content;
        break;
      case 'og:image':
        metadata.image = content;
        break;
      case 'og:site_name':
        metadata.siteName = content;
        break;
      case 'og:url':
        metadata.url = content;
        break;
    }
  }

  return metadata;
}
