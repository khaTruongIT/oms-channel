"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-heading mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-heading
            transition-all duration-200 placeholder:text-gray-400
            focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none
            hover:border-gray-400
            ${error ? "border-danger focus:border-danger focus:ring-danger/10" : "border-gray-300"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
