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
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-apple-400 to-apple-700 text-white shadow-md shadow-apple-700/30",
          sizes[size].icon
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-1/2 w-1/2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 18 L12 4 L20 18" />
          <path d="M8 14 L16 14" />
        </svg>
      </span>
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
