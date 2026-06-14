import { create } from "zustand";

interface DialogStore {
  transactionOpen: boolean;
  accountOpen: boolean;
  budgetOpen: boolean;
  recurringOpen: boolean;
  setTransactionOpen: (v: boolean) => void;
  setAccountOpen: (v: boolean) => void;
  setBudgetOpen: (v: boolean) => void;
  setRecurringOpen: (v: boolean) => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  transactionOpen: false,
  accountOpen: false,
  budgetOpen: false,
  recurringOpen: false,
  setTransactionOpen: (v) => set({ transactionOpen: v }),
  setAccountOpen: (v) => set({ accountOpen: v }),
  setBudgetOpen: (v) => set({ budgetOpen: v }),
  setRecurringOpen: (v) => set({ recurringOpen: v }),
}));
