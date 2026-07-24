import { Sparkles, X } from 'lucide-react'

interface AssistantHeaderProps {
  titleId: string
  subtitleId: string
  onClose: () => void
}

export default function AssistantHeader({
  titleId,
  subtitleId,
  onClose,
}: AssistantHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-slate-950/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-indigo-400/15 text-cyan-200"
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-white sm:text-xl"
            >
              Jarvis
            </h2>
            <p
              id={subtitleId}
              className="truncate text-sm text-slate-400"
            >
              How can I help you today?
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-label="Close Jarvis"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
