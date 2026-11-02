import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Icon } from "@/components/common/legacy"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "orange"
  size?: "sm" | "md" | "lg"
  icon?: string
  iconPosition?: "left" | "right"
  isLoading?: boolean
  children?: ReactNode
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  disabled = false,
  className = "",
  type = "submit",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "min-h-9 h-9 px-3.5 text-xs font-semibold gap-1.5",
    md: "min-h-11 h-11 px-4 text-sm font-semibold gap-2",
    lg: "min-h-12 h-12 px-6 text-base font-bold gap-2.5",
  }

  const variantClasses = {
    primary: "bg-[#245f3b] text-white hover:bg-[#1c4e30] active:scale-[0.98] shadow-sm",
    secondary: "bg-[#eaf4ec] text-[#245f3b] hover:bg-[#d8edd9] active:scale-[0.98]",
    outline: "border border-[#cbd9cd] bg-white text-[#344b3a] hover:border-[#9fbea4] hover:bg-[#f6faf6] active:scale-[0.98]",
    ghost: "bg-transparent text-[#315b3d] hover:bg-[#f0f6f1] active:scale-[0.98]",
    danger: "bg-[#dc2626] text-white hover:bg-[#b91c1c] active:scale-[0.98]",
    orange: "bg-[#ff5722] text-white hover:bg-[#ea4d18] active:scale-[0.98] shadow-sm",
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`btn inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] disabled:cursor-not-allowed disabled:opacity-55 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : icon && iconPosition === "left" ? (
        <Icon name={icon} size={size === "sm" ? 15 : size === "lg" ? 20 : 18} />
      ) : null}
      {children}
      {!isLoading && icon && iconPosition === "right" && (
        <Icon name={icon} size={size === "sm" ? 15 : size === "lg" ? 20 : 18} />
      )}
    </button>
  )
}

export default Button
