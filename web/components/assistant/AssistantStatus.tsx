export type AssistantState = 'idle' | 'thinking' | 'completed' | 'error'

interface AssistantStatusProps {
  state: AssistantState
}

const statusStyles: Record<
  AssistantState,
  { label: string; dotClassName: string }
> = {
  idle: {
    label: 'Ready',
    dotClassName: 'bg-emerald-400',
  },
  thinking: {
    label: 'Thinking',
    dotClassName: 'bg-amber-300',
  },
  completed: {
    label: 'Completed',
    dotClassName: 'bg-cyan-300',
  },
  error: {
    label: 'Error',
    dotClassName: 'bg-rose-400',
  },
}

export default function AssistantStatus({ state }: AssistantStatusProps) {
  const status = statusStyles[state]

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium tracking-wide text-slate-200"
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
        aria-hidden="true"
      />
      {status.label}
    </div>
  )
}
