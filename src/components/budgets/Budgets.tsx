import { useEffect, useState } from 'react'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { budgetService, type Budget } from '../../services/budgetService'
import { categoryService, type Category } from '../../services/categoryService'
import { userSettingsService } from '../../services/userSettingsService'
import { formatCurrency } from '../../utils/formatCurrency'
import { ConfirmModal } from '../ui/ConfirmModal'
import { useNotification } from '../../contexts/NotificationContext'

type BudgetWithCategory = Budget & { categories: { id: string; name: string } | null }

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

export const Budgets = () => {
  const { user } = useAuth()
  const { showSuccess } = useNotification()
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currency, setCurrency] = useState('USD')
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startDate, setStartDate] = useState(getMonthRange().start)
  const [endDate, setEndDate] = useState(getMonthRange().end)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<BudgetWithCategory | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithCategory | null>(null)

  const load = async () => {
    if (!user) return
    try {
      const [list, cats, settings] = await Promise.all([
        budgetService.list(user.id),
        categoryService.list(user.id),
        userSettingsService.getForUser(user.id),
      ])
      setBudgets(list as BudgetWithCategory[])
      setCategories(cats.filter((c) => c.type === 'expense'))
      if (settings?.currency) setCurrency(settings.currency)
      if (categoryId === '' && cats.filter((c) => c.type === 'expense')[0]) setCategoryId(cats.filter((c) => c.type === 'expense')[0].id)
    } catch (_) {}
  }
  useEffect(() => { void load() }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSaving(true)
    try {
      const num = Number(amount)
      if (!num || num <= 0) { setError('Enter a valid amount.'); return }
      await budgetService.create({ userId: user.id, categoryId: categoryId || (categories[0]?.id ?? ''), amount: num, period: 'monthly', startDate, endDate })
      setOpen(false)
      setAmount('')
      showSuccess('Budget successfully added')
      void load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add budget.') }
    finally { setSaving(false) }
  }

  const openDetail = (b: BudgetWithCategory) => {
    setSelected(b)
    setEditMode(false)
    setEditAmount(String(b.amount))
    setEditCategoryId(b.category_id)
    setEditStartDate(b.start_date)
    setEditEndDate(b.end_date)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setEditSaving(true)
    setError(null)
    try {
      const num = Number(editAmount)
      if (!num || num <= 0) { setError('Enter a valid amount.'); return }
      await budgetService.update(selected.id, { categoryId: editCategoryId, amount: num, startDate: editStartDate, endDate: editEndDate })
      void load()
      setSelected(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update.') }
    finally { setEditSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await budgetService.delete(deleteTarget.id)
      void load()
      setDeleteTarget(null)
      setSelected(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete.') }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <h1 className="text-xl font-semibold text-[var(--text)]">Budgets</h1>
          <p className="text-sm text-[var(--text-muted)]">Set limits per category and track spending.</p>
        </header>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          Add budget
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Add budget</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--border)]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</div>}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Amount</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">End date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        {budgets.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No budgets yet. Use “Add budget” to create one.</p>
        ) : (
          <>
            <ul className="space-y-0 text-sm">
              {budgets.map((b) => (
                <li
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(b)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(b)}
                  className="flex justify-between items-center py-3 px-2 -mx-2 rounded-lg border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--page-bg)]/50 touch-manipulation"
                >
                  <span className="text-[var(--text)] font-medium">{b.categories?.name ?? 'Category'}</span>
                  <span className="font-medium text-[var(--text)]">{formatCurrency(Number(b.amount), currency)}</span>
                </li>
              ))}
            </ul>
            <hr className="my-4 border-[var(--border)]" />
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-[var(--text)]">Total budget</span>
              <span className="text-lg font-semibold text-[var(--text)]">{formatCurrency(totalBudget, currency)}</span>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">{editMode ? 'Edit budget' : 'Budget details'}</h2>
              <button type="button" onClick={() => setSelected(null)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--border)]"><X className="h-5 w-5" /></button>
            </div>
            {editMode ? (
              <form onSubmit={handleEdit} className="space-y-4">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</div>}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Category</label>
                  <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Amount</label>
                  <input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">Start date</label>
                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text)]">End date</label>
                    <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]">Cancel</button>
                  <button type="submit" disabled={editSaving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{editSaving ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            ) : (
              <>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-[var(--text-muted)]">Category</dt><dd className="font-medium text-[var(--text)]">{selected.categories?.name ?? '—'}</dd></div>
                  <div><dt className="text-[var(--text-muted)]">Amount</dt><dd className="font-medium text-[var(--text)]">{formatCurrency(Number(selected.amount), currency)}</dd></div>
                  <div><dt className="text-[var(--text-muted)]">Period</dt><dd className="font-medium text-[var(--text)]">{selected.start_date} to {selected.end_date}</dd></div>
                </dl>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button type="button" onClick={() => { setDeleteTarget(selected); setSelected(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete budget?"
        description="This budget will be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
