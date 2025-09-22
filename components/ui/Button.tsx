import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASSES = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-300',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus-visible:ring-gray-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-800',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:ring-red-300',
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
