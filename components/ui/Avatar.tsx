import { SafeImage } from './SafeImage';

export function Avatar({ src, alt }: { src?: string; alt?: string }) {
  if (!src || src.trim().length === 0) {
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
    );
  }

  return (
    <SafeImage
      src={src}
      alt={alt || 'avatar'}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
    />
  );
}
