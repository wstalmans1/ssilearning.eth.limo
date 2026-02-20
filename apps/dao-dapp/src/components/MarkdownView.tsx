/**
 * Simple markdown renderer for learning content.
 * Handles headers, bold, lists, code blocks, and links.
 */

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  if (!remaining) return null
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (boldMatch) {
      parts.push(<strong key={parts.length}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
    } else if (linkMatch) {
      parts.push(
        <a
          key={parts.length}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 underline hover:no-underline"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
    } else if (codeMatch) {
      parts.push(
        <code key={parts.length} className="rounded bg-zinc-700 px-1 font-mono text-xs">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
    } else {
      const nextSpec = remaining.search(/(\*\*|\[|\`)/)
      const chunk = nextSpec >= 0 ? remaining.slice(0, nextSpec) : remaining
      if (chunk) parts.push(chunk)
      // Consume chunk + (matched spec or one char to avoid infinite loop)
      if (nextSpec >= 0) {
        remaining = remaining.slice(nextSpec)
        // If no spec pattern matched this loop, consume one char to make progress
        if (remaining && !remaining.match(/^(\*\*.+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/)) {
          parts.push(remaining.charAt(0))
          remaining = remaining.slice(1)
        }
      } else {
        remaining = ''
      }
    }
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let codeBlock: string[] = []
  let inCodeBlock = false
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item.trim())}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function flushCodeBlock() {
    if (codeBlock.length > 0) {
      elements.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded bg-zinc-800 p-3 text-xs text-zinc-300"
        >
          <code>{codeBlock.join('\n')}</code>
        </pre>
      )
      codeBlock = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      flushList()
      if (inCodeBlock) {
        flushCodeBlock()
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      codeBlock.push(line)
      continue
    }
    if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={key++} className="my-4 border-zinc-700" />)
      continue
    }
    if (line.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={key++} className="mt-3 text-sm font-medium text-zinc-300">
          {parseInline(line.slice(5))}
        </h4>
      )
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={key++} className="mt-4 text-sm font-semibold text-white">
          {parseInline(line.slice(4))}
        </h3>
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} className="mt-6 text-base font-semibold text-white">
          {parseInline(line.slice(3))}
        </h2>
      )
      continue
    }
    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={key++} className="mt-6 text-lg font-bold text-white">
          {parseInline(line.slice(2))}
        </h1>
      )
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = line.slice(2).trim()
      if (item) listItems.push(item)
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      flushList()
      const item = line.replace(/^\d+\.\s/, '')
      elements.push(
        <p key={key++} className="my-1 pl-4">
          {parseInline(item)}
        </p>
      )
      continue
    }
    if (line.trim()) {
      flushList()
      elements.push(
        <p key={key++} className="my-2 text-zinc-400">
          {parseInline(line)}
        </p>
      )
    } else {
      flushList()
      elements.push(<div key={key++} className="h-2" />)
    }
  }
  flushList()
  flushCodeBlock()

  return (
    <div className="prose prose-invert max-w-none [&_strong]:text-zinc-200">
      {elements}
    </div>
  )
}
