import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A call to action: a link drawn as a quiet outlined button. A section has
 * at most one.
 */
export function ActionLink({
  className = "",
  ...link
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...link}
      className={`inline-flex h-12 items-center border border-platinum-dim px-7 text-small tracking-open whitespace-nowrap text-platinum transition-colors duration-(--duration-quick) ease-settle hover:border-steel hover:text-steel ${className}`}
    />
  );
}
