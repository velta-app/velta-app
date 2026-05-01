"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconColorPicker } from "@/components/shared/icon-color-picker";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useCategories } from "@/hooks/use-categories";
import { CATEGORY_TYPES, type CategoryType } from "@/lib/constants";
import { emitMutation } from "@/lib/data-bus";
import { DEFAULT_CATEGORY_ICON, DEFAULT_COLOR } from "@/lib/icons";
import type { Category } from "@/types";

interface CategoryFormProps {
  initial?: Partial<Category>;
  defaultType?: CategoryType;
  parentId?: string | null;
  onDone: () => void;
}

export function CategoryForm({
  initial,
  defaultType = "expense",
  parentId,
  onDone,
}: CategoryFormProps) {
  const { user } = useSession();
  const supabase = React.useMemo(() => createClient(), []);
  const { categories } = useCategories();

  const [name, setName] = React.useState(initial?.name ?? "");
  const [type, setType] = React.useState<CategoryType>(
    (initial?.type as CategoryType) ?? defaultType
  );
  const [parent, setParent] = React.useState<string>(
    initial?.parent_id ?? parentId ?? "none"
  );
  const [icon, setIcon] = React.useState<string>(
    initial?.icon ?? DEFAULT_CATEGORY_ICON
  );
  const [color, setColor] = React.useState<string>(
    initial?.color ?? DEFAULT_COLOR
  );
  const [loading, setLoading] = React.useState(false);

  const parentOptions = categories.filter(
    (c) => c.parent_id === null && c.type === type && c.id !== initial?.id
  );
  const parentCategory = categories.find(
    (c) => c.id === (parent === "none" ? null : parent)
  );
  const isSubcategory = parent !== "none";
  const effectiveColor = isSubcategory
    ? parentCategory?.color ?? DEFAULT_COLOR
    : color;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      type,
      parent_id: parent === "none" ? null : parent,
      icon,
      color: effectiveColor,
    };

    const { error } = initial?.id
      ? await supabase.from("categories").update(payload).eq("id", initial.id)
      : await supabase.from("categories").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Category updated" : "Category created");
    emitMutation("categories");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <IconColorPicker
          icon={icon}
          color={effectiveColor}
          onChange={(v) => {
            setIcon(v.icon);
            if (!isSubcategory) setColor(v.color);
          }}
          fallback="category"
          lockColor={isSubcategory}
        />
        <p className="text-xs text-muted-foreground">
          {isSubcategory
            ? "Color inherits from the parent category"
            : "Tap to customize"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent">Parent (optional)</Label>
        <Select value={parent} onValueChange={setParent}>
          <SelectTrigger id="parent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent (top-level)</SelectItem>
            {parentOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.id ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
