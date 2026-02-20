interface HelpCalloutProps {
  title: string
  children: React.ReactNode
  variant?: 'info' | 'tip' | 'warning'
  onDismiss?: () => void
}

export function HelpCallout({ title, children, variant = 'info', onDismiss }: HelpCalloutProps) {
  const styles = {
    info: 'border-zinc-600 bg-zinc-800/40 text-zinc-300',
    tip: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-200/90',
    warning: 'border-amber-700/50 bg-amber-950/20 text-amber-200/90'
  }
  const icons = {
    info: 'ℹ️',
    tip: '💡',
    warning: '⚠️'
  }
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${styles[variant]} ${onDismiss ? 'pr-10 relative' : ''}`}
      role="note"
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <p className="mb-1 font-medium text-white/90">{icons[variant]} {title}</p>
      <div className="[&_a]:text-emerald-400 [&_a]:underline [&_a:hover]:no-underline [&_code]:rounded [&_code]:bg-zinc-700 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs">
        {children}
      </div>
    </div>
  )
}
