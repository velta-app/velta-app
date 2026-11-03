"use client";

import { toast } from "sonner";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useBudget, useUpdateProfile } from "@/hooks/use-budget";
import { HORIZONS } from "@/lib/constants";

/** How many months ahead the budget and forecast look. */
export function HorizonPicker() {
  const { horizon } = useBudget();
  const update = useUpdateProfile();
  return (
    <SegmentedControl
      size="sm"
      value={String(horizon)}
      onChange={async (v) => {
        const { error } = await update({ horizon_months: Number(v) });
        if (error) toast.error(error.message);
      }}
      options={HORIZONS.map((h) => ({ value: String(h.value), label: h.label }))}
    />
  );
}
