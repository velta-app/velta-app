"use client";

import * as React from "react";
import { Check, Pencil, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { EntityIcon } from "./entity-icon";
import {
  COLOR_PALETTE,
  ICON_LIBRARY,
  ICON_NAMES,
  DEFAULT_COLOR,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconColorPickerProps {
  icon: string | null;
  color: string | null;
  onChange: (next: { icon: string; color: string }) => void;
  fallback?: "account" | "category";
  lockColor?: boolean;
}

export function IconColorPicker({
  icon,
  color,
  onChange,
  fallback = "category",
  lockColor = false,
}: IconColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const activeIcon = icon ?? (fallback === "account" ? "wallet" : "receipt");
  const activeColor = color ?? DEFAULT_COLOR;

  const filteredIcons = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group relative inline-flex items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Edit icon and color"
        >
          <EntityIcon
            icon={activeIcon}
            color={activeColor}
            fallback={fallback}
            size="xl"
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors group-hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Tabs defaultValue="icon">
          <TabsList
            className={cn(
              "grid w-full rounded-none rounded-t-md",
              lockColor ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            <TabsTrigger value="icon">Icon</TabsTrigger>
            {!lockColor && <TabsTrigger value="color">Color</TabsTrigger>}
          </TabsList>

          <TabsContent value="icon" className="m-0 p-3">
            <div className="mb-2 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search icons"
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <div
              role="radiogroup"
              aria-label="Choose icon"
              className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto overscroll-contain pr-1"
            >
              {filteredIcons.map((name) => {
                const Icon = ICON_LIBRARY[name];
                const selected = name === activeIcon;
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={name}
                    onClick={() =>
                      onChange({ icon: name, color: activeColor })
                    }
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected &&
                        "bg-primary/10 text-primary ring-2 ring-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <p className="col-span-6 py-6 text-center text-xs text-muted-foreground">
                  No icons match &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          </TabsContent>

          {!lockColor && (
            <TabsContent value="color" className="m-0 p-3">
              <div
                role="radiogroup"
                aria-label="Choose color"
                className="grid max-h-64 grid-cols-7 gap-2 overflow-y-auto overscroll-contain pr-1"
              >
                {COLOR_PALETTE.map((c) => {
                  const selected = c.value === activeColor;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={c.name}
                      onClick={() =>
                        onChange({ icon: activeIcon, color: c.value })
                      }
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-full border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: c.value }}
                    >
                      {selected && (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{
                            color: isLight(c.value) ? "#111" : "#fff",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
