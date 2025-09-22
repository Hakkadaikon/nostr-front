import { SafeImage } from './SafeImage';

export function Avatar({ src, alt }: { src?: string; alt?: string }) {
  const imageSrc = src && src.trim().length > 0 ? src : '/images/avatar-placeholder.png';

  return (
    <SafeImage
      src={imageSrc}
      alt={alt || 'avatar'}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
    />
  );
}
