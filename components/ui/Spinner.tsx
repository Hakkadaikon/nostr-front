import { clsx } from 'clsx';

export type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  className?: string;
  size?: SpinnerSize;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  small: 'h-4 w-4',
  medium: 'h-5 w-5',
  large: 'h-8 w-8',
};

export function Spinner({ className, size = 'medium' }: SpinnerProps = {}) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        SIZE_MAP[size],
        className
      )}
      aria-hidden
    />
  );
}
