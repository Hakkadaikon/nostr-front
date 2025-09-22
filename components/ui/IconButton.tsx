import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type IconButtonVariant = 'default' | 'like' | 'retweet' | 'zap' | 'share';
type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  count?: number;
}

const BASE_CLASSES = 'group inline-flex items-center gap-2 transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

const ICON_WRAPPER_CLASSES = 'p-2 rounded-full transition-all duration-200 hover:scale-110';

const VARIANT_CLASSES: Record<IconButtonVariant, { 
  default: string; 
  active: string;
  hover: string;
}> = {
  default: {
    default: 'text-gray-500 dark:text-gray-400',
    active: 'text-purple-600 dark:text-purple-400',
    hover: 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800 group-hover:text-gray-700 dark:group-hover:text-gray-300'
  },
  like: {
    default: 'text-gray-500 dark:text-gray-400',
    active: 'text-red-500',
    hover: 'group-hover:bg-red-50 dark:group-hover:bg-red-950/20 group-hover:text-red-500'
  },
  retweet: {
    default: 'text-gray-500 dark:text-gray-400',
    active: 'text-green-500',
    hover: 'group-hover:bg-green-50 dark:group-hover:bg-green-950/20 group-hover:text-green-500'
  },
  zap: {
    default: 'text-gray-500 dark:text-gray-400',
    active: 'text-yellow-500',
    hover: 'group-hover:bg-yellow-50 dark:group-hover:bg-yellow-950/20 group-hover:text-yellow-500 dark:group-hover:text-yellow-400'
  },
  share: {
    default: 'text-gray-500 dark:text-gray-400',
    active: 'text-purple-600 dark:text-purple-400',
    hover: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20 group-hover:text-purple-500 dark:group-hover:text-purple-400'
  }
};

export function IconButton({ 
  className, 
  variant = 'default', 
  size = 'medium',
  active = false,
  count,
  type = 'button', 
  children,
  ...props 
}: IconButtonProps) {
  const variantStyles = VARIANT_CLASSES[variant];
  const currentStyles = active ? variantStyles.active : variantStyles.default;

  return (
    <button
      type={type}
      className={clsx(
        BASE_CLASSES,
        SIZE_CLASSES[size],
        currentStyles,
        className
      )}
      {...props}
    >
      <div className={clsx(ICON_WRAPPER_CLASSES, variantStyles.hover)}>
        {children}
      </div>
      {count !== undefined && (
        <span className="text-sm">{count}</span>
      )}
    </button>
  );
}