import { clsx } from 'clsx';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps = {}) {
  return (
    <div 
      className={clsx(
        "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )} 
      aria-hidden 
    />
  );
}
