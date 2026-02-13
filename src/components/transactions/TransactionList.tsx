import { useEffect, useState, useMemo } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { categoryService, type Category } from "../../services/categoryService";
import {
  transactionService,
  type TransactionType,
} from "../../services/transactionService";
import { userSettingsService } from "../../services/userSettingsService";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  handleAmountInputChange,
  parseAmountFromDisplay,
} from "../../utils/amountInput";
import { ConfirmModal } from "../ui/ConfirmModal";

type UiTransaction = {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  receiptUrl: string | null;
};

export const TransactionList = () => {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [grossIncome, setGrossIncome] = useState<number | null>(null);
  const [redLineAmount, setRedLineAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<UiTransaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<TransactionType>("expense");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReceiptUrl, setEditReceiptUrl] = useState<string | null>(null);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UiTransaction | null>(null);

  const { totalIncome, remaining, isRedLine } = useMemo(() => {
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const incomeTx = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const income = (grossIncome ?? 0) + incomeTx;
    const rem = income - expenses;
    const redLine = redLineAmount != null && rem <= redLineAmount;

    return {
      totalExpenses: expenses,
      totalIncomeTx: incomeTx,
      totalIncome: income,
      remaining: rem,
      isRedLine: redLine,
    };
  }, [transactions, grossIncome, redLineAmount]);

  const filteredTransactions = useMemo(() => {
    const s = search.toLowerCase();
    return transactions.filter((t) => {
      return (
        (t.description?.toLowerCase().includes(s) ?? false) ||
        t.categoryName.toLowerCase().includes(s)
      );
    });
  }, [transactions, search]);


  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setLoading(true);
        const [txList, cats, settings] = await Promise.all([
          transactionService.list(user.id),
          categoryService.ensureDefaults(user.id),
          userSettingsService.getForUser(user.id),
        ]);
        setCategories(cats);
        if (settings?.gross_income != null)
          setGrossIncome(settings.gross_income);
        if (settings?.red_line_amount != null)
          setRedLineAmount(settings.red_line_amount);
        if (settings?.currency) setCurrency(settings.currency);
        if (cats.length > 0 && !categoryId) {
          const uncategorized = cats.find(
            (c) => c.name === "Uncategorized" && c.type === "expense",
          );
          setCategoryId(uncategorized?.id ?? cats[0].id);
        }
        setTransactions(
          txList.map((t) => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            categoryId: t.category?.id ?? "",
            categoryName: t.category?.name ?? "Uncategorized",
            receiptUrl: t.receipt_url,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  useEffect(() => {
    if (
      categories.length > 0 &&
      type === "expense" &&
      !categories.some((c) => c.id === categoryId && c.type === "expense")
    ) {
      const firstExpense = categories.find((c) => c.type === "expense");
      if (firstExpense) setCategoryId(firstExpense.id);
    }
    if (
      categories.length > 0 &&
      type === "income" &&
      !categories.some((c) => c.id === categoryId && c.type === "income")
    ) {
      const firstIncome = categories.find((c) => c.type === "income");
      if (firstIncome) setCategoryId(firstIncome.id);
    }
  }, [type, categories, categoryId]);

  useEffect(() => {
    if (!editing) return;
    const typeCats = categories.filter((c) => c.type === editType);
    if (typeCats.length > 0 && !typeCats.some((c) => c.id === editCategoryId)) {
      setEditCategoryId(typeCats[0].id);
    }
  }, [editing, editType, categories, editCategoryId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setError(null);
      const amountNumber = parseAmountFromDisplay(amount);
      if (!amountNumber || amountNumber <= 0) {
        setError("Enter a valid amount.");
        return;
      }
      const catId =
        categoryId || (await categoryService.getUncategorizedId(user.id));
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const uploaded = await transactionService.uploadReceipt(
          receiptFile,
          user.id,
        );
        receiptUrl = uploaded.publicUrl;
      }
      const today = new Date().toISOString().slice(0, 10);
      const created = await transactionService.create({
        userId: user.id,
        amount: amountNumber,
        type,
        categoryId: catId,
        date: today,
        description: description || undefined,
        receiptUrl: receiptUrl ?? undefined,
      });
      const cat = categories.find(
        (c) => c.id === (created as { category_id: string }).category_id,
      );
      const newTransaction: UiTransaction = {
        id: created.id,
        date: created.date,
        description: created.description,
        amount: created.amount,
        type: created.type,
        categoryId: catId,
        categoryName: cat?.name ?? "Uncategorized",
        receiptUrl,
      };
      // Add new transaction and sort by date (descending)
      setTransactions((prev) => 
        [newTransaction, ...prev].sort((a, b) => 
          b.date.localeCompare(a.date)
        )
      );
      setAmount("");
      setDescription("");
      setReceiptFile(null);
      showSuccess('Transaction added');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add transaction.",
      );
    }
  };

  const typeCategories = categories.filter((c) => c.type === type);

  const openEdit = (tx: UiTransaction) => {
    setEditing(tx);
    setEditAmount(
      tx.amount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    );
    setEditType(tx.type);
    setEditCategoryId(tx.categoryId);
    setEditDate(tx.date);
    setEditDescription(tx.description ?? "");
    setEditReceiptUrl(tx.receiptUrl);
    setEditReceiptFile(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    setError(null);
    try {
      const amountNumber = parseAmountFromDisplay(editAmount);
      if (!amountNumber || amountNumber <= 0) {
        setError("Enter a valid amount.");
        return;
      }
      const typeCategoriesForEdit = categories.filter(
        (c) => c.type === editType,
      );
      const catId = typeCategoriesForEdit.some((c) => c.id === editCategoryId)
        ? editCategoryId
        : (typeCategoriesForEdit[0]?.id ?? editing.categoryId);
      
      let finalReceiptUrl = editReceiptUrl;
      if (editReceiptFile && user) {
        const uploaded = await transactionService.uploadReceipt(
          editReceiptFile,
          user.id,
        );
        finalReceiptUrl = uploaded.publicUrl;
      }

      await transactionService.update(editing.id, {
        amount: amountNumber,
        type: editType,
        categoryId: catId,
        date: editDate,
        description: editDescription || null,
        receiptUrl: finalReceiptUrl,
      });
      const cat = categories.find((c) => c.id === catId);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                amount: amountNumber,
                type: editType,
                categoryId: catId,
                categoryName: cat?.name ?? "Uncategorized",
                date: editDate,
                description: editDescription || null,
                receiptUrl: finalReceiptUrl,
              }
            : t,
        ),
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await transactionService.delete(deleteTarget.id);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">
            Transactions
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Add and view income and expenses. Attach receipts (PNG, JPG, PDF).
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 pl-9 pr-3 text-sm text-[var(--text)] transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      {/* Stats header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total monthly income</p>
            <p className="mt-1 text-xl font-semibold text-income">
              {formatCurrency(totalIncome, currency)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Gross + income transactions</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Remaining to budget
              {redLineAmount != null && (
                <span className="ml-2 font-normal normal-case text-red-600 dark:text-red-400">
                  (Red line: {formatCurrency(redLineAmount, currency)})
                </span>
              )}
            </p>
            <p className={`mt-1 inline-block rounded-lg px-3 py-1 text-xl font-semibold transition-colors ${isRedLine ? 'bg-red-600 text-white shadow-sm' : 'bg-neutral-800 text-white shadow-sm'}`}>
              {formatCurrency(remaining, currency)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Total monthly income − actual expenses</p>
          </div>
        </div>
      </div>


      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-4"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) =>
                setAmount(handleAmountInputChange(amount, e.target.value))
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
            >
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Receipt
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[var(--text-muted)] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-primary-hover"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Notes"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] transition-colors min-h-[44px] touch-manipulation cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add transaction
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="px-4 py-8 text-sm text-[var(--text-muted)] text-center">
            Loading…
          </div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                  Category
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)]">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                  Receipt
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page-bg)]/50"
                >
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {tx.date}
                  </td>
                  <td className="px-4 py-3 text-[var(--text)]">
                    {tx.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {tx.categoryName}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${tx.type === "expense" ? "text-expense" : "text-income"}`}
                  >
                    {tx.type === "expense" ? "−" : "+"}
                    {formatCurrency(tx.amount, currency)}
                  </td>
                  <td className="px-4 py-3">
                    {tx.receiptUrl ? (
                      <a
                        href={tx.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(tx)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tx)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--text-muted)]"
                  >
                    No transactions yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setEditing(null)}
          >
            <div
              className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] w-full max-w-md p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Edit transaction
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--border)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) =>
                      setEditAmount(
                        handleAmountInputChange(editAmount, e.target.value),
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value as TransactionType)
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Category
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    {categories
                      .filter((c) => c.type === editType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                    Receipt
                  </label>
                  {editReceiptUrl && !editReceiptFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded border border-[var(--border)] bg-[var(--page-bg)]">
                      <a
                        href={editReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline px-1"
                      >
                        View current
                      </a>
                      <button
                        type="button"
                        onClick={() => setEditReceiptUrl(null)}
                        className="ml-auto p-1 text-[var(--text-muted)] hover:text-red-500"
                        aria-label="Remove receipt"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => setEditReceiptFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-[var(--text-muted)] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-primary-hover"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete transaction?"
          description="This transaction will be removed. Totals will update. This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
};
