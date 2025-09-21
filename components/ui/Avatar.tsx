export function Avatar({ src, alt }: { src?: string; alt?: string }) {
  return (
    <img
      src={src || '/images/avatar-placeholder.png'}
      alt={alt || 'avatar'}
      className="h-10 w-10 rounded-full object-cover"
      loading="lazy"
    />
  );
}
