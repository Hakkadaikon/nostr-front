import { InputHTMLAttributes } from 'react';

export function Switch(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-blue-600" />
    </label>
  );
}
