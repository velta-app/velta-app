"use client";

import { toast } from "sonner";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useUpdateProfile } from "@/hooks/use-budget";
import { useSession } from "@/hooks/use-session";

/** Switch the display currency (everything converts with the USD→MXN rate). */
export function CurrencyToggle() {
  const { profile } = useSession();
  const update = useUpdateProfile();
  return (
    <SegmentedControl
      size="sm"
      value={profile?.default_currency ?? "MXN"}
      onChange={async (v) => {
        const { error } = await update({ default_currency: v as "MXN" | "USD" });
        if (error) toast.error(error.message);
      }}
      options={[
        { value: "MXN", label: "MXN" },
        { value: "USD", label: "USD" },
      ]}
    />
  );
}
