import { Sparkles, X } from 'lucide-react'

interface AssistantFloatingButtonProps {
  open: boolean
  onToggle: () => void
}

export default function AssistantFloatingButton({
  open,
  onToggle,
}: AssistantFloatingButtonProps) {
  const label = open ? 'Close Jarvis' : 'Open Jarvis'

  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-[110] inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-slate-950/90 px-4 text-sm font-semibold text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 motion-reduce:transform-none motion-reduce:transition-none sm:bottom-6 sm:right-6 sm:h-14 sm:px-5"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="jarvis-assistant-overlay"
      aria-keyshortcuts="Meta+J Control+J"
      title={`${label} (⌘J / Ctrl+J)`}
    >
      {open ? (
        <X className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">
        {open ? 'Close' : 'Jarvis'}
      </span>
    </button>
  )
}
