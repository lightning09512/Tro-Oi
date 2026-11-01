import type { HTMLAttributes, ReactNode } from "react"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "verified" | "orange" | "transfer" | "hot" | "new" | "neutral" | "danger"
  size?: "sm" | "md"
  children: ReactNode
}

export function Badge({
  children,
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-bold",
    md: "px-2.5 py-1 text-xs font-semibold",
  }

  const variantClasses = {
    brand: "bg-[#eaf4ec] text-[#245f3b] border border-[#d6e8d9]",
    verified: "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]",
    orange: "bg-[#fff2e7] text-[#ea580c] border border-[#fed7aa]",
    transfer: "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]",
    hot: "bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]",
    new: "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]",
    neutral: "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    danger: "bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2]",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full leading-none tracking-tight whitespace-nowrap transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
