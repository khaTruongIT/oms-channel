"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "success" | "info";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

  const variantStyles = {
    primary:
      "bg-[#4f46e5] text-white shadow-md hover:bg-[#4338ca] hover:shadow-lg active:translate-y-px border border-transparent",
    secondary:
      "bg-white text-heading border border-secondary-200 hover:bg-secondary-50 shadow-sm hover:text-primary hover:border-primary/30",
    danger:
      "bg-danger text-white shadow-sm hover:bg-danger-dark active:translate-y-px",
    success:
      "bg-success text-white shadow-sm hover:bg-success-dark active:translate-y-px",
    info: "bg-info text-white shadow-sm hover:bg-info-dark active:translate-y-px",
    outline:
      "bg-transparent text-primary border border-primary hover:bg-primary-50",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
