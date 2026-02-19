import type { FormEvent, ReactNode } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

export type AuthCardMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email'

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
  onBackToLogin?: () => void
  passwordFooter?: ReactNode
  confirmPassword?: string
  onConfirmPasswordChange?: (value: string) => void
  otp?: string
  onOtpChange?: (value: string) => void
  onResendOtp?: () => void
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
  onBackToLogin,
  passwordFooter,
  confirmPassword,
  onConfirmPasswordChange,
  otp,
  onOtpChange,
  onResendOtp,
}: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-200 dark:from-[var(--page-bg)] dark:via-[var(--page-bg)] dark:to-[var(--page-bg)] p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl overflow-hidden rounded-[2rem] flex flex-col md:flex-row bg-[var(--card-bg)] border border-[var(--border)] shadow-[var(--shadow-professional)] ring-1 ring-black/[0.03] dark:ring-white/[0.03] relative z-10"
      >
        {/* Left: Branding */}
        <div className="hidden md:flex md:w-5/12 min-h-[520px] flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 dark:from-blue-950/20 dark:to-indigo-950/20 border-r border-[var(--border)] relative overflow-hidden">
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center relative z-10"
          >
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ring-2 ring-primary/20">
              <img src="/favicon.svg" alt="" className="h-9 w-9" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
              MoneyGrid
            </h2>
            <p className="text-base text-[var(--text)] font-medium max-w-xs leading-relaxed">
              Track income, expenses, budgets, and savings in one place. <span className="text-primary font-bold">Take control of your money.</span>
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
              <span className="text-lg font-bold text-[var(--text)]">MoneyGrid</span>
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

              {_mode !== 'reset-password' && _mode !== 'verify-email' && (
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
                      'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 text-base text-[var(--text)]',
                      'placeholder:text-[var(--text-muted)]',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                </div>
              )}

              {_mode !== 'forgot-password' && _mode !== 'verify-email' && (
                <div>
                  <label
                    htmlFor={passwordId}
                    className="block text-sm font-medium text-[var(--text)] mb-1.5"
                  >
                    {_mode === 'reset-password' ? 'New Password' : 'Password'}{' '}
                    <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={passwordId}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder={
                        _mode === 'reset-password'
                          ? 'Enter new password'
                          : 'Enter your password'
                      }
                      autoComplete={passwordAutoComplete}
                      required
                      minLength={passwordMinLength}
                      className={cn(
                        'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 pr-11 text-base text-[var(--text)]',
                        'placeholder:text-[var(--text-muted)]',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
                      <button
                        type="button"
                        className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[var(--border)] active:scale-90"
                        onClick={onShowPasswordToggle}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <motion.div
                          key={showPassword ? 'eye-off' : 'eye'}
                          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="text-[var(--text-muted)] group-hover:text-[var(--text)]"
                        >
                          {showPassword ? (
                            <EyeOff size={20} strokeWidth={2.25} />
                          ) : (
                            <Eye size={20} strokeWidth={2.25} />
                          )}
                        </motion.div>
                      </button>
                    </div>
                  </div>
                  {passwordFooter && (
                    <div className="mt-1.5 flex justify-end">
                      {passwordFooter}
                    </div>
                  )}
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
              )}

              {onConfirmPasswordChange && (
                <div>
                  <label
                    htmlFor={`${passwordId}-confirm`}
                    className="block text-sm font-medium text-[var(--text)] mb-1.5"
                  >
                    Confirm Password <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`${passwordId}-confirm`}
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      className={cn(
                        'flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-4 py-2 pr-11 text-base text-[var(--text)]',
                        'placeholder:text-[var(--text-muted)]',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    />
                  </div>
                </div>
              )}

              {_mode === 'verify-email' && onOtpChange && (
                <div>
                  <label
                    htmlFor="otp-input"
                    className="block text-sm font-medium text-[var(--text)] mb-3 text-center"
                  >
                    Verification Code
                  </label>
                  <div className="flex justify-center gap-2 mb-4 relative">
                    {/* Hidden actual input for focus and accessibility */}
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => onOtpChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      required
                      autoFocus
                      className="absolute inset-0 opacity-0 cursor-default"
                    />
                    
                    {/* Visible digit boxes */}
                    {[...Array(6)].map((_, i) => {
                      const char = otp?.[i] || ''
                      const isFocused = (otp?.length || 0) === i
                      return (
                        <div
                          key={i}
                          className={cn(
                            'h-14 w-12 flex items-center justify-center text-2xl font-bold rounded-xl border transition-all duration-200 bg-[var(--page-bg)] text-[var(--text)]',
                            isFocused 
                              ? 'border-primary ring-2 ring-primary/20 scale-105' 
                              : char 
                                ? 'border-[var(--border)]' 
                                : 'border-[var(--border)] opacity-60'
                          )}
                        >
                          {char}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={onResendOtp}
                      className="text-sm font-medium text-primary hover:underline focus:outline-none"
                    >
                      Didn&apos;t receive a code? Resend
                    </button>
                  </div>
                </div>
              )}

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
              {_mode === 'forgot-password' && onBackToLogin && (
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="font-semibold text-primary hover:underline focus:outline-none focus:underline"
                >
                  Back to sign in
                </button>
              )}
              {_mode !== 'forgot-password' && footer}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}