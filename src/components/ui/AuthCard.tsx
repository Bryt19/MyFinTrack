import type { FormEvent, ReactNode } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

export type AuthCardMode = 'signin' | 'signup'

export type AuthCardProps = {
  mode: AuthCardMode
  title: string
  subtitle: string
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  showPassword: boolean
  onShowPasswordToggle: () => void
  onSubmit: (e: FormEvent) => void
  loading: boolean
  error: string | null
  submitLabel: string
  footer: ReactNode
  success?: string | null
  /** Sign up only: live password requirement errors */
  passwordErrors?: string[]
  /** Sign up only: hint text below password */
  passwordHint?: string
  emailId?: string
  passwordId?: string
  emailAutoComplete?: 'email' | 'username'
  passwordAutoComplete?: 'current-password' | 'new-password'
  passwordMinLength?: number
}

export function AuthCard({
  mode: _mode,
  title,
  subtitle,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  showPassword,
  onShowPasswordToggle,
  onSubmit,
  loading,
  error,
  submitLabel,
  footer,
  passwordErrors = [],
  passwordHint,
  emailId = 'auth-email',
  passwordId = 'auth-password',
  emailAutoComplete = 'email',
  passwordAutoComplete = 'current-password',
  passwordMinLength = 6,
  success,
}: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-[var(--page-bg)] dark:via-[var(--page-bg)] dark:to-[var(--page-bg)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex flex-col md:flex-row bg-[var(--card-bg)] border border-[var(--border)] shadow-xl shadow-black/5 dark:shadow-none"
      >
        {/* Left: Branding */}
        <div className="hidden md:flex md:w-1/2 min-h-[480px] flex-col items-center justify-center p-8 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 border-r border-[var(--border)]">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ring-2 ring-primary/20">
              <img src="/favicon.svg" alt="" className="h-9 w-9" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
              MyFinTrack
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs">
              Track income, expenses, budgets, and savings in one place. Take control of your money.
            </p>
          </motion.div>
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Mobile Branding */}
            <div className="flex flex-col items-center mb-8 md:hidden">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 ring-1 ring-primary/20">
                <img src="/favicon.svg" alt="" className="h-7 w-7" />
              </div>
              <span className="text-lg font-bold text-[var(--text)]">MyFinTrack</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-1">
              {title}
            </h1>
            <p className="text-[var(--text-muted)] mb-8">{subtitle}</p>

            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor={emailId}
                  className="block text-sm font-medium text-[var(--text)] mb-1.5"
                >
                  Email <span className="text-primary">*</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete={emailAutoComplete}
                  required
                  className={cn(
                    'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-sm text-[var(--text)]',
                    'placeholder:text-[var(--text-muted)]',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor={passwordId}
                  className="block text-sm font-medium text-[var(--text)] mb-1.5"
                >
                  Password <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={passwordAutoComplete}
                    required
                    minLength={passwordMinLength}
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 pr-11 text-sm text-[var(--text)]',
                      'placeholder:text-[var(--text-muted)]',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    onClick={onShowPasswordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordHint && (
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                    {passwordHint}
                  </p>
                )}
                {passwordErrors.length > 0 && (
                  <ul className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 list-disc list-inside space-y-0.5">
                    {passwordErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="pt-1"
              >
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold',
                    'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
                    'transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                    'disabled:pointer-events-none disabled:opacity-50'
                  )}
                >
                  {submitLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
              {success && (
                <div
                  className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200 text-center font-medium"
                  role="alert"
                >
                  {success}
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
              {footer}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
