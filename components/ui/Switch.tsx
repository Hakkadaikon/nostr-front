import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ onCheckedChange, onChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input 
          ref={ref}
          type="checkbox" 
          className="sr-only peer" 
          onChange={handleChange}
          checked={checked}
          {...props} 
        />
        <div className={clsx(
          "h-6 w-11 rounded-full transition-colors duration-200 ease-in-out",
          "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-gray-900",
          checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"
        )}>
          <div className={clsx(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            checked ? "translate-x-6" : "translate-x-1"
          )} />
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';
