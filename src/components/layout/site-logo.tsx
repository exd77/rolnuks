import Link from "next/link";

import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  variant?: "full" | "mark";
  href?: string;
}

/**
 * ORBLOX brand mark. Renders as inline SVG so it inherits theme colors.
 * Replace this component when the user-provided logo asset is ready
 * (drop the file to `public/logo.svg` and switch to <Image> if PNG/JPG).
 */
export function SiteLogo({
  className,
  variant = "full",
  href = "/",
}: SiteLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-extrabold tracking-tight",
        className,
      )}
      aria-label="ORBLOX home"
    >
      <span className="bg-primary text-primary-foreground grid h-9 w-9 place-items-center rounded-lg text-lg shadow-sm">
        O
      </span>
      {variant === "full" && (
        <span className="text-foreground text-xl">ORBLOX</span>
      )}
    </Link>
  );
}
