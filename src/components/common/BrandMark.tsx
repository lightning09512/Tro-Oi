type BrandMarkProps = {
  size?: number
  className?: string
}

export default function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <img
      className={className}
      src="/tro-oi-icon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
