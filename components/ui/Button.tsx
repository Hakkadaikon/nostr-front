import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'link';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE_CLASSES = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const SIZE_CLASSES: Record<ButtonSize, string> = {
  small: 'px-3 py-1.5 text-sm rounded-lg',
  medium: 'px-4 py-2 text-sm rounded-xl',
  large: 'px-6 py-3 text-base rounded-2xl',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 focus-visible:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-300',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus-visible:ring-gray-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  danger: 'bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:ring-red-300',
  success: 'bg-green-500 text-white shadow-md shadow-green-500/20 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30 focus-visible:ring-green-500 dark:bg-green-500 dark:hover:bg-green-400 dark:focus-visible:ring-green-300',
  link: 'bg-transparent text-purple-600 underline-offset-4 hover:underline hover:text-purple-700 focus-visible:ring-purple-500 dark:text-purple-400 dark:hover:text-purple-300',
};

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  type = 'button', 
  ...props 
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        BASE_CLASSES, 
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant], 
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
}
