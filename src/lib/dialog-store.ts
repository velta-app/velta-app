import { create } from "zustand";
import type { Fund, PlannedItem } from "@/types";

/** Globally controlled dialogs, so any screen (or the FAB) can open them. */
interface DialogStore {
  item: { open: boolean; initial?: Partial<PlannedItem> };
  fund: { open: boolean; initial?: Partial<Fund> };
  split: boolean;
  openItem: (initial?: Partial<PlannedItem>) => void;
  openFund: (initial?: Partial<Fund>) => void;
  openSplit: () => void;
  close: (which: "item" | "fund" | "split") => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  item: { open: false },
  fund: { open: false },
  split: false,
  openItem: (initial) => set({ item: { open: true, initial } }),
  openFund: (initial) => set({ fund: { open: true, initial } }),
  openSplit: () => set({ split: true }),
  close: (which) =>
    set((s) =>
      which === "split"
        ? { split: false }
        : { [which]: { ...s[which], open: false } }
    ),
}));
