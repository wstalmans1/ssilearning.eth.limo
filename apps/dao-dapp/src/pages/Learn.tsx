import { useState } from 'react'
import { MarkdownView } from '../components/MarkdownView'
import { CollapsibleHelp } from '../components/CollapsibleHelp'

// Load learning content from docs (via Vite alias)
import learningPath from '@docs/learning/02_LEARNING_PATH.md?raw'
import quickStart from '@docs/learning/01_QUICK_START.md?raw'
import phase2Impl from '@docs/learning/03_PHASE_2_IMPLEMENTATION.md?raw'
import didResolution from '@docs/learning/04_DID_RESOLUTION_EXPLAINED.md?raw'
import phase3Impl from '@docs/learning/05_PHASE_3_IMPLEMENTATION.md?raw'

const SECTIONS: { id: string; title: string; content: string }[] = [
  { id: 'quick-start', title: 'Quick Start', content: quickStart },
  { id: 'learning-path', title: 'Learning Path (Phases 0–7)', content: learningPath },
  { id: 'phase2', title: 'Phase 2: Implementation Guide', content: phase2Impl },
  { id: 'did-resolution', title: 'DID Resolution Explained', content: didResolution },
  { id: 'phase3', title: 'Phase 3: Verifiable Credentials', content: phase3Impl },
]

export function Learn() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Read through the learning phases below. Each section expands to show the full content.
      </p>

      {SECTIONS.map((section) => (
        <div key={section.id} className="rounded-lg border border-zinc-700/60 bg-zinc-800/30">
          <button
            type="button"
            onClick={() => setOpenId((prev) => (prev === section.id ? null : section.id))}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800/50"
          >
            <span>{section.title}</span>
            <span className="text-zinc-500">{openId === section.id ? '−' : '+'}</span>
          </button>
          {openId === section.id && (
            <div className="max-h-[60vh] overflow-y-auto border-t border-zinc-700/60 px-4 py-4">
              <MarkdownView content={section.content} />
            </div>
          )}
        </div>
      ))}

      <CollapsibleHelp title="Need the raw files?">
        The learning docs live in <code>docs/learning/</code> in the repo. You can read them in
        your editor or on GitHub.
      </CollapsibleHelp>
    </div>
  )
}
