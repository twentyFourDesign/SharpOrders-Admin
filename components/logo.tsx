import Image from "next/image";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function Logo({
  className = "",
  width = 120,
  height = 120,
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="SharpOrder"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
