import { useState } from 'react'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

export type ThemeToggleProps = {
  /** true = dark mode (toggle on) */
  checked: boolean
  onChange: () => void
  /** Optional label, e.g. "Dark mode" */
  label?: string
}

export function ThemeToggle({ checked, onChange, label }: ThemeToggleProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span
          className={cn(
            'hidden sm:inline text-sm font-medium transition-colors duration-300',
            checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
          )}
        >
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={onChange}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          'group relative h-5 w-9 rounded-full p-1 transition-all duration-500 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-bg)]',
          'touch-manipulation',
          checked ? 'bg-[var(--text)]' : 'bg-[var(--text-muted)]/20'
        )}
      >
        {/* Track inner */}
        <div
          className={cn(
            'absolute inset-[2px] rounded-full transition-all duration-500',
            checked ? 'bg-[var(--text)]' : 'bg-transparent'
          )}
        />

        {/* Thumb */}
        <div
          className={cn(
            'relative h-3 w-3 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
            'bg-[var(--card-bg)]',
            checked ? 'translate-x-4' : 'translate-x-0',
            isPressed ? 'scale-90 duration-150' : ''
          )}
        >
          {/* Thumb inner shine */}
          <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--border)]" />

          {/* Thumb highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--card-bg)]/80 via-transparent to-transparent" />

          {/* Status indicator dot */}
          <div
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500',
              checked
                ? 'h-1.5 w-1.5 bg-[var(--text)] opacity-100 scale-100'
                : 'h-1 w-1 bg-[var(--text-muted)]/40 opacity-100 scale-100'
            )}
          />
        </div>
      </button>
    </div>
  )
}
