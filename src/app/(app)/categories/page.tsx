"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityIcon } from "@/components/shared/entity-icon";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import {
  buildCategoryTree,
  useCategories,
} from "@/hooks/use-categories";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { cn } from "@/lib/utils";
import type { CategoryWithChildren } from "@/types";
import type { CategoryType } from "@/lib/constants";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();
  const [tab, setTab] = React.useState<CategoryType>("expense");

  const tree = React.useMemo(
    () => buildCategoryTree(categories.filter((c) => c.type === tab)),
    [categories, tab]
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize where your money goes"
        actions={<CategoryDialog defaultType={tab} />}
      />
      <PageSection>
        <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryType)}>
          <TabsList>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No categories yet"
                description="Create your first category to organize transactions"
                action={<CategoryDialog defaultType={tab} />}
              />
            ) : (
              <CategoryGrid roots={tree} type={tab} />
            )}
          </TabsContent>
        </Tabs>
      </PageSection>
    </div>
  );
}

function CategoryGrid({
  roots,
  type,
}: {
  roots: CategoryWithChildren[];
  type: CategoryType;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [items, setItems] = React.useState(roots);

  React.useEffect(() => {
    setItems(roots);
  }, [roots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);

    const updates = next.map((c, idx) =>
      supabase.from("categories").update({ sort_order: idx }).eq("id", c.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) toast.error("Failed to reorder");
    else emitMutation("categories");
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((cat) => (
            <SortableCategoryTile key={cat.id} category={cat} />
          ))}
          <CategoryDialog
            defaultType={type}
            trigger={
              <button
                type="button"
                className="flex aspect-[4/3] min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">New category</span>
              </button>
            }
          />
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryTile({
  category,
}: {
  category: CategoryWithChildren;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });
  const supabase = React.useMemo(() => createClient(), []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function archive(id: string) {
    const { error } = await supabase
      .from("categories")
      .update({ is_archived: true })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Category archived");
      emitMutation("categories");
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-[4/3] min-h-[112px] rounded-xl border border-border bg-card transition-shadow",
        isDragging && "z-10 opacity-60 shadow-lg"
      )}
    >
      <AddTransactionDialog
        initial={{
          type: category.type === "expense" ? "expense" : "income",
          category_id: category.id,
        }}
        trigger={
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <EntityIcon
              icon={category.icon}
              color={category.color}
              fallback="category"
              size="lg"
            />
            <span className="line-clamp-2 text-sm font-medium">
              {category.name}
            </span>
            {category.children.length > 0 && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {category.children.length} sub
              </span>
            )}
          </button>
        }
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="pointer-events-auto rounded p-1 text-muted-foreground hover:bg-muted cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="pointer-events-auto flex items-center gap-0.5">
          <CategoryDialog
            defaultType={category.type}
            parentId={category.id}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7"
                aria-label="Add subcategory"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7"
                aria-label="Options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <CategoryDialog
                initial={category}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                onClick={() => archive(category.id)}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="h-4 w-4" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
