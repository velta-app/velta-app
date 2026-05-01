"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  MoreVertical,
  Pencil,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Amount } from "@/components/shared/amount";
import { EmptyState } from "@/components/shared/empty-state";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
import { createClient } from "@/lib/supabase/client";
import { emitMutation, useMutationListener } from "@/lib/data-bus";
import { FREQUENCIES } from "@/lib/constants";
import { createChannelName } from "@/lib/utils";
import type { RecurringRule } from "@/types";

function freqLabel(f: string) {
  return FREQUENCIES.find((x) => x.value === f)?.label ?? f;
}

export default function RecurringPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [rules, setRules] = React.useState<RecurringRule[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("recurring_rules")
      .select("*")
      .order("next_occurrence", { ascending: true });
    setRules(data ?? []);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
    const ch = supabase
      .channel(createChannelName("recurring-rules-changes"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_rules" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, load]);

  useMutationListener(["recurring_rules"], load);

  async function toggle(rule: RecurringRule) {
    const { error } = await supabase
      .from("recurring_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);
    if (error) toast.error(error.message);
    else emitMutation("recurring_rules");
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Recurring rule deleted");
      emitMutation("recurring_rules");
    }
  }

  return (
    <div>
      <PageHeader
        title="Recurring"
        description="Automate what repeats"
        actions={<RecurringDialog />}
      />
      <PageSection>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring rules yet"
            description="Add one for rent, subscriptions, or paychecks"
            action={<RecurringDialog />}
          />
        ) : (
          <div className="space-y-3">
            {rules.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Repeat className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {r.note || `${r.type} · ${freqLabel(r.frequency)}`}
                      </p>
                      <Badge variant={r.is_active ? "success" : "muted"}>
                        {r.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {freqLabel(r.frequency)} · next{" "}
                      {format(parseISO(r.next_occurrence), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Amount
                    value={r.amount}
                    currency={r.currency}
                    intent={r.type}
                    signed={r.type !== "transfer"}
                  />
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={() => toggle(r)}
                    aria-label="Toggle active"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <RecurringDialog
                        initial={r}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        onClick={() => remove(r.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  );
}
