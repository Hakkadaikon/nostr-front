import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50',
        className,
      )}
    />
  );
}
