interface HelpCalloutProps {
  title: string
  children: React.ReactNode
  variant?: 'info' | 'tip' | 'warning'
}

export function HelpCallout({ title, children, variant = 'info' }: HelpCalloutProps) {
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
      className={`rounded-lg border p-3 text-sm ${styles[variant]}`}
      role="note"
    >
      <p className="mb-1 font-medium text-white/90">{icons[variant]} {title}</p>
      <div className="[&_a]:text-emerald-400 [&_a]:underline [&_a:hover]:no-underline [&_code]:rounded [&_code]:bg-zinc-700 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs">
        {children}
      </div>
    </div>
  )
}
