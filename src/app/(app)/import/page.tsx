"use client";

import * as React from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageSection } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EntityIcon } from "@/components/shared/entity-icon";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { createClient } from "@/lib/supabase/client";
import { emitMutation } from "@/lib/data-bus";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/types";

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"' && !inQ) { inQ = true; }
    else if (ch === '"' && inQ) { inQ = false; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const vals = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim().toLowerCase(), vals[i]?.trim() ?? ""]));
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type RowType = "income" | "expense" | "transfer" | "skip";
const ROW_TYPES: RowType[] = ["income", "expense", "transfer", "skip"];

interface ParsedRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  // from CSV columns
  csvType: RowType | null;
  csvAccount: string;       // account name from CSV
  csvToAccount: string;     // transfer destination account name from CSV
  csvCategory: string;      // category name from CSV
  note: string;
  // user override (null = use csvType or autoType)
  override: RowType | null;
}

const PAGE_SIZE = 50;

// ─── Name matching helpers ───────────────────────────────────────────────────

function findAccountByName(name: string, accounts: Account[]): Account | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return accounts.find((a) => a.name.toLowerCase() === lower) ??
    accounts.find((a) => a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase()));
}

function findCategoryByName(name: string, categories: Category[]): Category | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return categories.find((c) => c.name.toLowerCase() === lower) ??
    categories.find((c) => c.name.toLowerCase().includes(lower));
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ImportPage() {
  const { user, profile } = useSession();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const supabase = React.useMemo(() => createClient(), []);

  const [step, setStep] = React.useState<"upload" | "configure" | "importing" | "done">("upload");
  const [fileName, setFileName] = React.useState("");
  const [rows, setRows] = React.useState<ParsedRow[]>([]);
  const [overrides, setOverrides] = React.useState<Map<number, RowType>>(new Map());

  // global defaults (used when CSV doesn't specify)
  const [defaultAccountId, setDefaultAccountId] = React.useState("");
  const [positiveSign, setPositiveSign] = React.useState<"income" | "expense">("income");
  const [affectsBalance, setAffectsBalance] = React.useState(true);

  const [page, setPage] = React.useState(0);
  const [importedCount, setImportedCount] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  // ── resolve effective type for each row ──────────────────────────────────

  const rowsResolved = React.useMemo(() =>
    rows.map((r) => {
      const autoType: RowType = r.amount > 0
        ? positiveSign
        : positiveSign === "income" ? "expense" : "income";
      const effectiveType: RowType = overrides.get(r.id) ?? r.csvType ?? autoType;
      return { ...r, autoType, effectiveType };
    }),
    [rows, positiveSign, overrides]
  );

  const summary = React.useMemo(() => {
    const counts = { income: 0, expense: 0, transfer: 0, skip: 0 };
    rowsResolved.forEach((r) => counts[r.effectiveType]++);
    return counts;
  }, [rowsResolved]);

  const totalImport = summary.income + summary.expense + summary.transfer;
  const pageRows = rowsResolved.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(rowsResolved.length / PAGE_SIZE);

  // ── file handling ────────────────────────────────────────────────────────

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed.length) { toast.error("No rows found"); return; }

      const keys = Object.keys(parsed[0]);
      // Column detection (case-insensitive, lowercased by parser)
      const dateKey = keys.find((k) => /date|fecha/.test(k)) ?? keys[0];
      const amtKey = keys.find((k) => /amount|monto|total|importe|valor/.test(k)) ?? keys[2];
      const descKey = keys.find((k) => /desc|concept|concepto|note|detail|nombre/.test(k)) ?? keys[1];
      const typeKey = keys.find((k) => /^type$|^tipo$/.test(k));
      const accKey = keys.find((k) => /^account$|^cuenta$|^from.?account/.test(k));
      const toAccKey = keys.find((k) => /^to.?account$|^transfer.?to|^cuenta.?destino/.test(k));
      const catKey = keys.find((k) => /^category$|^categoria$|^cat$/.test(k));
      const noteKey = keys.find((k) => /^note$|^nota$|^comment/.test(k));

      const CSV_TYPE_MAP: Record<string, RowType> = {
        income: "income", ingreso: "income", credit: "income", credito: "income",
        expense: "expense", gasto: "expense", debit: "expense", debito: "expense",
        transfer: "transfer", transferencia: "transfer",
        skip: "skip", ignore: "skip",
      };

      const result: ParsedRow[] = parsed
        .map((r, i) => {
          const rawAmt = (r[amtKey] ?? "0").replace(/[^0-9.\-]/g, "");
          const amount = parseFloat(rawAmt) || 0;
          const rawType = typeKey ? r[typeKey]?.toLowerCase().trim() : "";
          const csvType = rawType ? (CSV_TYPE_MAP[rawType] ?? null) : null;
          return {
            id: i,
            date: r[dateKey] ?? "",
            description: r[descKey] ?? "",
            amount,
            csvType,
            csvAccount: accKey ? (r[accKey] ?? "") : "",
            csvToAccount: toAccKey ? (r[toAccKey] ?? "") : "",
            csvCategory: catKey ? (r[catKey] ?? "") : "",
            note: noteKey ? (r[noteKey] ?? "") : "",
            override: null,
          };
        })
        .filter((r) => r.amount !== 0 || r.description);

      setRows(result);
      setOverrides(new Map());
      setPage(0);
      setStep("configure");
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // ── per-row type cycle ───────────────────────────────────────────────────

  function cycleType(id: number, current: RowType) {
    const next = ROW_TYPES[(ROW_TYPES.indexOf(current) + 1) % ROW_TYPES.length];
    setOverrides((prev) => new Map(prev).set(id, next));
  }

  // ── import ───────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!user) return;

    const toImport = rowsResolved.filter((r) => r.effectiveType !== "skip");
    if (!toImport.length) { toast.error("No rows to import (all skipped)"); return; }

    // Validate: each row needs an account
    const missingAccount = toImport.find((r) => {
      const acc = findAccountByName(r.csvAccount, accounts);
      return !acc && !defaultAccountId;
    });
    if (missingAccount) {
      toast.error("Some rows have no account. Set a default account.");
      return;
    }

    setStep("importing");
    const batchId = crypto.randomUUID();

    const payload = toImport.map((r) => {
      const resolvedAcc = findAccountByName(r.csvAccount, accounts)?.id ?? defaultAccountId;
      const resolvedToAcc = findAccountByName(r.csvToAccount, accounts)?.id ?? "";
      const resolvedCat = findCategoryByName(r.csvCategory, categories)?.id ?? null;

      return {
        user_id: user.id,
        type: r.effectiveType as "income" | "expense" | "transfer",
        amount: Math.abs(r.amount),
        currency: profile?.default_currency ?? "MXN",
        date: r.date,
        description: r.description || null,
        note: r.note || null,
        category_id: r.effectiveType === "transfer" ? null : resolvedCat,
        from_account_id:
          r.effectiveType === "expense" || r.effectiveType === "transfer"
            ? resolvedAcc || null
            : null,
        to_account_id:
          r.effectiveType === "income"
            ? resolvedAcc || null
            : r.effectiveType === "transfer"
            ? resolvedToAcc || null
            : null,
        affects_balance: affectsBalance,
        import_batch_id: batchId,
      };
    });

    const CHUNK = 200;
    let count = 0;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const { error } = await supabase.from("transactions").insert(payload.slice(i, i + CHUNK));
      if (error) { toast.error(`Import failed: ${error.message}`); setStep("configure"); return; }
      count += Math.min(CHUNK, payload.length - i);
    }

    emitMutation("transactions"); emitMutation("accounts");
    setImportedCount(count);
    setStep("done");
  }

  function reset() {
    setStep("upload"); setFileName(""); setRows([]); setOverrides(new Map()); setPage(0);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Import Transactions" description="Bulk-import from a CSV file" />

      <PageSection className="max-w-5xl">
        {step === "upload" && (
          <UploadZone
            dragging={dragging}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onFileInput={handleFileInput}
          />
        )}

        {(step === "configure" || step === "importing") && (
          <div className="space-y-6">
            {/* File bar */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{fileName}</span>
              <span className="text-sm text-muted-foreground">{rows.length} rows</span>
              <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Defaults */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Default account</Label>
                <AccountSelectSimple accounts={accounts} value={defaultAccountId} onChange={setDefaultAccountId} />
                <p className="text-[11px] text-muted-foreground">Used when the CSV has no Account column</p>
              </div>
              <div className="space-y-2">
                <Label>Positive amounts are</Label>
                <Select value={positiveSign} onValueChange={(v) => setPositiveSign(v as "income" | "expense")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income (credit)</SelectItem>
                    <SelectItem value="expense">Expense (debit)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Used when the CSV has no Type column</p>
              </div>
              <div className="space-y-2">
                <Label>Affect balance</Label>
                <Select value={affectsBalance ? "yes" : "no"} onValueChange={(v) => setAffectsBalance(v === "yes")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — update balance</SelectItem>
                    <SelectItem value="no">No — record only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-600 dark:text-green-400">{summary.income} income</span>
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-600 dark:text-red-400">{summary.expense} expense</span>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-blue-600 dark:text-blue-400">{summary.transfer} transfer</span>
              <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{summary.skip} skipped</span>
              <span className="ml-auto text-muted-foreground">{totalImport} will be imported</span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Account</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const resolvedAcc = findAccountByName(r.csvAccount, accounts)
                        ?? accounts.find((a) => a.id === defaultAccountId);
                      const resolvedCat = findCategoryByName(r.csvCategory, categories);
                      return (
                        <tr key={r.id} className={cn("border-b border-border last:border-0 transition-colors", r.effectiveType === "skip" && "opacity-40")}>
                          <td className="px-4 py-2.5 tabular-nums text-muted-foreground whitespace-nowrap">{r.date}</td>
                          <td className="max-w-[220px] px-4 py-2.5">
                            <p className="truncate font-medium">{r.description || "—"}</p>
                            {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
                          </td>
                          <td className="px-4 py-2.5">
                            {resolvedAcc ? (
                              <span className="flex items-center gap-1.5 text-xs">
                                <EntityIcon icon={resolvedAcc.icon} color={resolvedAcc.color} fallback="account" size="xs" />
                                <span className="max-w-[100px] truncate">{resolvedAcc.name}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-destructive">no account</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {resolvedCat ? (
                              <span className="flex items-center gap-1.5">
                                <EntityIcon icon={resolvedCat.icon} color={resolvedCat.color} fallback="category" size="xs" />
                                <span className="max-w-[90px] truncate">{resolvedCat.name}</span>
                              </span>
                            ) : r.csvCategory ? (
                              <span className="text-amber-500">"{r.csvCategory}" not found</span>
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </td>
                          <td className={cn("px-4 py-2.5 text-right tabular-nums font-medium whitespace-nowrap", r.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {r.amount > 0 ? "+" : ""}{r.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button type="button" onClick={() => cycleType(r.id, r.effectiveType)} title="Click to cycle type" className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                              r.effectiveType === "income" && "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
                              r.effectiveType === "expense" && "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
                              r.effectiveType === "transfer" && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
                              r.effectiveType === "skip" && "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}>
                              {r.effectiveType}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rowsResolved.length)} of {rowsResolved.length}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="px-2">{page + 1} / {totalPages}</span>
                  <Button variant="ghost" size="icon-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleImport} disabled={step === "importing" || totalImport === 0}>
              {step === "importing" ? "Importing…" : `Import ${totalImport} transactions`}
            </Button>
          </div>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <div>
                <p className="text-xl font-semibold">{importedCount} transactions imported</p>
                <p className="mt-1 text-sm text-muted-foreground">Assign remaining categories from the Transactions page.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>Import another file</Button>
                <Button asChild><a href="/transactions">View transactions</a></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </PageSection>
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ dragging, onDragOver, onDragLeave, onDrop, onFileInput }: {
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <div className="rounded-full bg-muted p-4"><Upload className="h-8 w-8 text-muted-foreground" /></div>
        <div>
          <p className="text-base font-medium">Drop a CSV file here</p>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="sr-only" onChange={onFileInput} />
      </button>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Full format (recommended)</p>
            <div className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
              <p className="text-muted-foreground">Date,Description,Amount,Type,Account,TransferToAccount,Category,Note</p>
              <p>2026-01-15,Netflix,-250.00,expense,BBVA,,Streaming,Monthly sub</p>
              <p>2026-01-16,Salary,12000.00,income,,BBVA,Salary,</p>
              <p>2026-01-17,SPEI to Nu,-5000.00,transfer,BBVA,Cuenta Nu,,</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Minimal format (bank export)</p>
            <div className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
              <p className="text-muted-foreground">Date,Description,Amount</p>
              <p>2026-01-15,OXXO Store,-250.00</p>
              <p>2026-01-16,Salary deposit,12000.00</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span><strong>Type</strong> accepts: income, expense, transfer, skip. Leave blank to infer from amount sign.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span><strong>Account</strong> and <strong>Category</strong> are matched by name (case-insensitive). Unmatched categories import without a category.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>Inter-account transfers appear in both banks' exports. Set Type to <strong>skip</strong> on one side, or mark them as <strong>transfer</strong> and fill TransferToAccount.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Account select ───────────────────────────────────────────────────────────

function AccountSelectSimple({ accounts, value, onChange }: {
  accounts: Account[];
  value: string;
  onChange: (v: string) => void;
}) {
  const NONE = "__none__";
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger><SelectValue placeholder="None (use CSV column)" /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None (use CSV column)</SelectItem>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <div className="flex items-center gap-2">
              <EntityIcon icon={a.icon} color={a.color} fallback="account" size="xs" />
              {a.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
