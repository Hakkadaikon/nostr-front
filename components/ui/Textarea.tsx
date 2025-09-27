import { forwardRef, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={clsx(
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400',
        'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500',
        'dark:focus:border-purple-400 dark:focus:ring-purple-400/20',
        'dark:disabled:bg-gray-900 dark:disabled:text-gray-400',
        className
      )}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
