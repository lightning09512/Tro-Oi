import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  circle?: boolean
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  circle = false,
  className = '',
  style,
  ...props
}) => {
  const customStyle: React.CSSProperties = {
    ...style,
    width: width ?? '100%',
    height: height ?? '1rem',
    borderRadius: circle ? '50%' : (borderRadius ?? 'var(--radius-md, 8px)')
  }

  return (
    <div
      className={`ui-skeleton ${circle ? 'ui-skeleton-circle' : ''} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  )
}

export default Skeleton
