import { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx('w-full rounded border px-3 py-2', className)} />;
}
