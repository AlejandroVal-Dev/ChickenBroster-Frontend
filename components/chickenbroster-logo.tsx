import Image from "next/image"

interface ChickenBrosterLogoProps {
  size?: number
  className?: string
}

export function ChickenBrosterLogo({ size = 32, className = "" }: ChickenBrosterLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/chickenbroster.png"
        alt="ChickenBroster Logo"
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}

// Variantes predefinidas para uso común
export const LogoVariants = {
  Small: () => <ChickenBrosterLogo size={16} />,
  Medium: () => <ChickenBrosterLogo size={24} />,
  Large: () => <ChickenBrosterLogo size={32} />,
  XLarge: () => <ChickenBrosterLogo size={48} />,
  XXLarge: () => <ChickenBrosterLogo size={64} />,
  Header: () => <ChickenBrosterLogo size={32} className="rounded-lg" />,
  Sidebar: () => <ChickenBrosterLogo size={40} className="rounded-xl" />,
  Loading: () => <ChickenBrosterLogo size={64} className="animate-pulse" />,
} 