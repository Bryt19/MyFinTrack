import { useEffect, useState } from 'react'
import { Plus, X, Pencil, Trash2, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { savingsService, type SavingsGoal } from '../../services/savingsService'
import { userSettingsService } from '../../services/userSettingsService'
import { formatCurrency } from '../../utils/formatCurrency'
import { handleAmountInputChange, parseAmountFromDisplay } from '../../utils/amountInput'
import { ConfirmModal } from '../ui/ConfirmModal'

export const SavingsGoals = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [currency, setCurrency] = useState('USD')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<SavingsGoal | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTargetAmount, setEditTargetAmount] = useState('')
  const [editCurrentAmount, setEditCurrentAmount] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    if (!user) return
    try {
      const [list, settings] = await Promise.all([
        savingsService.list(user.id),
        userSettingsService.getForUser(user.id),
      ])
      setGoals(list)
      if (settings?.currency) setCurrency(settings.currency)
    } catch (_) {}
  }

  useEffect(() => {
    void load()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSaving(true)
    try {
      const num = Number(targetAmount)
      if (!num || num <= 0) {
        setError('Enter a valid target amount.')
        return
      }
      await savingsService.create({
        userId: user.id,
        name: name.trim() || 'New goal',
        targetAmount: num,
        deadline: deadline || undefined,
      })
      setOpen(false)
      setName('')
      setTargetAmount('')
      setDeadline('')
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal.')
    } finally {
      setSaving(false)
    }
  }

  const openDetail = (g: SavingsGoal) => {
    setSelected(g)
    setEditMode(false)
    setEditName(g.name)
    setEditTargetAmount(String(g.target_amount))
    setEditCurrentAmount(String(g.current_amount))
    setEditDeadline(g.deadline ?? '')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setEditSaving(true)
    setError(null)
    try {
      const targetNum = Number(editTargetAmount)
      const currentNum = Number(editCurrentAmount)
      if (!targetNum || targetNum <= 0) {
        setError('Enter a valid target amount.')
        return
      }
      if (currentNum < 0) {
        setError('Current amount cannot be negative.')
        return
      }
      await savingsService.update(selected.id, {
        name: editName.trim() || selected.name,
        targetAmount: targetNum,
        currentAmount: currentNum,
        deadline: editDeadline || null,
      })
      void load()
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update.')
    } finally {
      setEditSaving(false)
    }
  }

  function getProgressColor(pct: number): string {
    if (pct >= 100) return 'bg-green-500'
    if (pct >= 66) return 'bg-green-400'
    if (pct >= 33) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await savingsService.delete(deleteTarget.id)
      void load()
      setDeleteTarget(null)
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }

  const handleAddToGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const num = parseAmountFromDisplay(addAmount)
    if (!num || num <= 0) {
      setError('Enter a valid amount to add.')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const newCurrent = selected.current_amount + num
      await savingsService.update(selected.id, { currentAmount: newCurrent })
      setAddAmount('')
      void load()
      setSelected((prev) =>
        prev ? { ...prev, current_amount: newCurrent } : null,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to goal.')
    } finally {
      setAdding(false)
    }
  }
  const filteredGoals = goals.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <h1 className="text-xl font-semibold text-[var(--text)]">Savings goals</h1>
          <p className="text-sm text-[var(--text-muted)]">Set targets and track progress.</p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search goals..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 pl-9 pr-3 text-sm text-[var(--text)] transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add savings goal
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Add savings goal</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--border)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Goal name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency fund"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Target amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Deadline (optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        {filteredGoals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No savings goals found matching "{search}".</p>
        ) : (
          <ul className="space-y-0 text-sm">
            {filteredGoals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
              return (
                <li
                  key={g.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(g)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(g)}
                  className="py-3 px-2 -mx-2 rounded-lg border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--page-bg)]/50 touch-manipulation"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text)]">{g.name}</p>
                      <p className="text-[var(--text-muted)]">
                        {formatCurrency(g.current_amount, currency)} / {formatCurrency(g.target_amount, currency)}
                        {g.target_amount > 0 && (
                          <span className="ml-1">({Math.round(pct)}%)</span>
                        )}
                      </p>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(pct)}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] shrink-0">{g.deadline ?? '—'}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">{editMode ? 'Edit goal' : 'Goal details'}</h2>
              <button type="button" onClick={() => setSelected(null)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--border)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            {editMode ? (
              <form onSubmit={handleEdit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Goal name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Target amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Current amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editCurrentAmount}
                    onChange={(e) => setEditCurrentAmount(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Deadline</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]">
                    Cancel
                  </button>
                  <button type="submit" disabled={editSaving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[var(--text-muted)]">Name</dt>
                    <dd className="font-medium text-[var(--text)]">{selected.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Progress</dt>
                    <dd className="font-medium text-[var(--text)]">
                      {formatCurrency(selected.current_amount, currency)} / {formatCurrency(selected.target_amount, currency)}
                      {selected.target_amount > 0 && (
                        <span className="ml-1 text-[var(--text-muted)]">
                          ({Math.round((selected.current_amount / selected.target_amount) * 100)}%)
                        </span>
                      )}
                    </dd>
                    {selected.target_amount > 0 && (
                      <div className="mt-2 h-3 w-full rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(Math.min(100, (selected.current_amount / selected.target_amount) * 100))}`}
                          style={{ width: `${Math.min(100, (selected.current_amount / selected.target_amount) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Deadline</dt>
                    <dd className="font-medium text-[var(--text)]">{selected.deadline ?? '—'}</dd>
                  </div>
                </dl>
                <form onSubmit={handleAddToGoal} className="mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] space-y-2">
                  <label className="block text-sm font-medium text-[var(--text)]">Add to savings</label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={addAmount}
                      onChange={(e) =>
                        setAddAmount(handleAmountInputChange(addAmount, e.target.value))
                      }
                      placeholder="0.00"
                      className="flex-1 min-w-[100px] rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text)]"
                    />
                    <button
                      type="submit"
                      disabled={adding}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                      {adding ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Add an amount to update progress toward your target.</p>
                </form>
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(selected)
                      setSelected(null)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
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
        title="Delete savings goal?"
        description="This goal will be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
