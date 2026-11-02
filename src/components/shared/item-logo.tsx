"use client";

import * as React from "react";
import Image from "next/image";
import { EntityIcon } from "@/components/shared/entity-icon";
import { getItemLogoUrl } from "@/lib/vendor-logo";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-8 w-8", px: 32, icon: "sm" as const },
  md: { box: "h-10 w-10", px: 40, icon: "md" as const },
};

/** Vendor logo (Google favicon CDN) with a colored icon fallback. */
export function ItemLogo({
  name,
  domain,
  icon,
  color,
  size = "md",
  className,
}: {
  name: string;
  domain?: string | null;
  icon?: string | null;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const url = getItemLogoUrl(name, domain);
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);
  const s = SIZES[size];

  if (url && failedUrl !== url) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white",
          s.box,
          className
        )}
      >
        <Image
          width={s.px}
          height={s.px}
          src={url}
          alt=""
          unoptimized
          className="size-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      </span>
    );
  }

  return (
    <EntityIcon
      icon={icon ?? "receipt"}
      color={color}
      size={s.icon}
      className={cn("rounded-full", className)}
    />
  );
}
