import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  userSettingsService,
  type UserSettings,
} from '../../services/userSettingsService'
import { clearAllUserData } from '../../services/dataService'
import { ConfirmModal } from '../ui/ConfirmModal'
import { useTheme } from '../../contexts/ThemeContext'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS', 'NGN']
const DATE_FORMATS = [
  { value: 'MM/DD', label: 'Month / Day (e.g. 12/31)' },
  { value: 'DD/MM', label: 'Day / Month (e.g. 31/12)' },
]
const START_OF_WEEK = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
]
const PREF_STORAGE_KEY = 'myfintrack_prefs'

const formatWithCommas = (val: string) => {
  if (!val) return ''
  const clean = val.replace(/,/g, '')
  if (clean === '.' || clean === '') return clean
  const parts = clean.split('.')
  if (parts.length > 2) return val // Invalid
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

const parseCommas = (val: string) => val.replace(/,/g, '')

export const Settings = () => {
  const { user, updateDisplayName, deleteAccount } = useAuth()
  const { isDark, setTheme } = useTheme()
  const [_settings, setSettings] = useState<UserSettings | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [grossIncome, setGrossIncome] = useState('')
  const [redLineAmount, setRedLineAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false)
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [dateFormat, setDateFormat] = useState('MM/DD')
  const [startOfWeek, setStartOfWeek] = useState('sunday')
  const [emailReminders, setEmailReminders] = useState(false)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [financialMessage, setFinancialMessage] = useState<string | null>(null)
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        setLoading(true)
        const existing = await userSettingsService.getForUser(user.id)
        if (existing) {
          setSettings(existing)
          setCurrency(existing.currency ?? 'USD')
          setGrossIncome(
            existing.gross_income != null ? formatWithCommas(String(existing.gross_income)) : '',
          )
          setRedLineAmount(
            existing.red_line_amount != null ? formatWithCommas(String(existing.red_line_amount)) : '',
          )
        }
        const display =
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          (user.email ? user.email.split('@')[0] : '')
        setDisplayName(display || '')
        try {
          const prefs = JSON.parse(localStorage.getItem(PREF_STORAGE_KEY) ?? '{}')
          if (prefs.dateFormat) setDateFormat(prefs.dateFormat)
          if (prefs.startOfWeek) setStartOfWeek(prefs.startOfWeek)
          if (typeof prefs.emailReminders === 'boolean') setEmailReminders(prefs.emailReminders)
          if (typeof prefs.enableNotifications === 'boolean') setEnableNotifications(prefs.enableNotifications)
        } catch (_) {}
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to load settings.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user])

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    setError(null)
    setNameMessage(null)
    try {
      await updateDisplayName(displayName.trim() || '')
      setNameMessage('Display name saved.')
      setTimeout(() => setNameMessage(null), 3500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save display name.')
    } finally {
      setSavingName(false)
    }
  }

  const savePreferences = () => {
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify({
      dateFormat,
      startOfWeek,
      emailReminders,
      enableNotifications,
    }))
    setPreferencesMessage('Preferences saved.')
    setTimeout(() => setPreferencesMessage(null), 3500)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const incomeNumber = grossIncome ? Number(parseCommas(grossIncome)) : null
      const redLine = redLineAmount ? Number(parseCommas(redLineAmount)) : null
      if (incomeNumber != null && incomeNumber < 0) {
        setError('Gross income cannot be negative.')
        return
      }
      if (redLine != null && redLine < 0) {
        setError('Red line amount cannot be negative.')
        return
      }

      const updated = await userSettingsService.upsert(user.id, {
        grossIncome: incomeNumber,
        redLineAmount: redLine,
        currency,
      })

      setSettings(updated)
      setFinancialMessage('Settings saved.')
      setTimeout(() => setFinancialMessage(null), 3500)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save settings.'
      setError(msg)
      console.error('Settings save error', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-[var(--text)]">Account & settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage your profile, finances, and preferences.
        </p>
      </header>

      {/* Profile */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3">Profile</h2>
        <dl className="space-y-2 text-sm mb-4">
          <div>
            <dt className="text-[var(--text-muted)]">Email</dt>
            <dd className="font-medium text-[var(--text)]">{user?.email ?? '—'}</dd>
          </div>
        </dl>
        <form onSubmit={handleSaveDisplayName} className="space-y-3 mb-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Display name / Username</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            />

  <p className="mt-1 text-xs text-[var(--text-muted)]">Shown in the sidebar and across the app. Saved to your account.</p>
  {nameMessage && (
    <div className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 border-l-2 border-emerald-500 shadow-sm animate-in fade-in slide-in-from-top-1">
      {nameMessage}
    </div>
  )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingName}
              className="rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary disabled:opacity-50 transition-colors min-h-[44px] touch-manipulation"
            >
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </div>
        </form>
        <p className="text-xs text-[var(--text-muted)] mt-2">Sign-in is managed by your auth provider. To change email or password, use the provider's account settings.</p>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-[var(--text)]">Financial defaults</h2>
        {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
        {error && (
          <div className="rounded-lg border-l-2 border-rose-500 bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm">
            {error}
          </div>
        )}
        {/* Global message for data clear etc. */}
        {message && (
          <div className="rounded-lg border-l-2 border-emerald-500 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Default currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Used for all amounts.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Monthly gross income</label>
            <input
              type="text"
              inputMode="decimal"
              value={grossIncome}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setGrossIncome(formatWithCommas(val))
              }}
              placeholder="Total income before expenses"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Baseline before expenses.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Red line amount (optional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={redLineAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setRedLineAmount(formatWithCommas(val))
              }}
              placeholder="Warn when remaining reaches this"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Show warning on Transactions when remaining is at or below this.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          {financialMessage && (
            <div className="inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 border-l-2 border-emerald-500 shadow-sm animate-in fade-in slide-in-from-right-1">
              {financialMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary disabled:opacity-50 transition-colors min-h-[44px] touch-manipulation"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Preferences */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Preferences</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Date format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            >
              {DATE_FORMATS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Start of week</label>
            <select
              value={startOfWeek}
              onChange={(e) => setStartOfWeek(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            >
              {START_OF_WEEK.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Theme</label>
            <select
              value={isDark ? 'dark' : 'light'}
              onChange={(e) => setTheme(e.target.value === 'dark')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 min-h-[44px] text-base text-[var(--text)] touch-manipulation"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] text-primary"
            />
            <label htmlFor="enableNotifications" className="text-sm font-medium text-[var(--text)]">Enable system notifications (e.g. Budget added)</label>
          </div>
          <input
            type="checkbox"
            id="emailReminders"
            checked={emailReminders}
            onChange={(e) => setEmailReminders(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] text-primary"
          />
          <label htmlFor="emailReminders" className="text-sm font-medium text-[var(--text)]">Email reminders (e.g. budget alerts)</label>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Stored on this device. Email reminders are not yet implemented.</p>
        <div className="flex items-center gap-3 justify-end">
          {preferencesMessage && (
            <div className="inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 border-l-2 border-emerald-500 shadow-sm animate-in fade-in slide-in-from-right-1">
              {preferencesMessage}
            </div>
          )}
          <button
            type="button"
            onClick={savePreferences}
            className="rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors min-h-[44px] touch-manipulation"
          >
            Save preferences
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3">Data</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">Export your transactions and budgets. (Export feature coming soon.)</p>
        <button
          type="button"
          onClick={() => { setExportMessage('Export is not available yet.'); setTimeout(() => setExportMessage(null), 3000); }}
          className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors min-h-[44px] touch-manipulation"
        >
          Export my data
        </button>
        {exportMessage && <p className="mt-2 text-sm text-[var(--text-muted)]">{exportMessage}</p>}
      </section>

      {/* About */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3">About</h2>
        <p className="text-sm text-[var(--text-muted)]">MyFinTrack — track income, expenses, budgets, and savings.</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Version 1.0.0</p>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Danger zone</h2>
        <p className="text-sm text-[var(--text-muted)]">
          These actions are irreversible. Use with caution.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => setClearDataModalOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors min-h-[44px] touch-manipulation"
          >
            Clear all data
          </button>
          <button
            type="button"
            onClick={() => setDeleteAccountModalOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors min-h-[44px] touch-manipulation"
          >
            Delete account
          </button>
        </div>
      </section>

      <ConfirmModal
        open={clearDataModalOpen}
        onClose={() => setClearDataModalOpen(false)}
        onConfirm={async () => {
          if (!user) return
          await clearAllUserData(user.id)
          setMessage('All your data has been cleared.')
          setSettings(null)
          setCurrency('USD')
          setGrossIncome('')
          setRedLineAmount('')
        }}
        title="Clear all data?"
        description={
          <>
            This will permanently delete all your transactions, budgets, savings goals, categories, and settings. You will stay signed in. This cannot be undone.
          </>
        }
        confirmLabel="Clear all data"
        variant="danger"
      />

      <ConfirmModal
        open={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        onConfirm={async () => {
          try {
            setSaving(true)
            await deleteAccount()
            window.location.href = '/'
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account.')
          } finally {
            setSaving(false)
          }
        }}
        title="Delete account?"
        description={
          <>
            This will permanently delete your account and all your data (transactions, budgets, savings, settings). This action is irreversible.
          </>
        }
        confirmLabel={saving ? 'Deleting…' : 'Delete my account'}
        variant="danger"
      />
    </div>
  )
}


