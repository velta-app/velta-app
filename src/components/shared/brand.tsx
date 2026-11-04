import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Brand({ className, iconOnly, size = "md" }: BrandProps) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-base" },
    md: { icon: "h-9 w-9", text: "text-lg" },
    lg: { icon: "h-12 w-12", text: "text-2xl" },
  } as const;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 512 512"
        className={cn("shrink-0", sizes[size].icon)}
        aria-hidden
      >
        <polygon points="96,112 188,112 300,408 212,408" fill="#2dfb78" />
        <polygon points="324,112 416,112 300,408 212,408" fill="#00a63e" />
        <polygon points="256,291.7 300,408 212,408" fill="#067530" />
      </svg>
      {!iconOnly && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            sizes[size].text
          )}
        >
          Velta
        </span>
      )}
    </div>
  );
}
