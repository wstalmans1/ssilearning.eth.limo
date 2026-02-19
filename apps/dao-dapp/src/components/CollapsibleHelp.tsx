import { useState } from 'react'

interface CollapsibleHelpProps {
  title: string
  children: React.ReactNode
}

export function CollapsibleHelp({ title, children }: CollapsibleHelpProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-400 hover:text-zinc-300"
      >
        <span>{title}</span>
        <span className="text-zinc-500">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-700/60 px-3 py-2 text-sm text-zinc-400 [&_code]:rounded [&_code]:bg-zinc-700 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs">
          {children}
        </div>
      )}
    </div>
  )
}
