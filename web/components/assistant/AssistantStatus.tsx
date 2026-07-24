import {
  AudioLines,
  BadgeCheck,
  BrainCircuit,
  Sparkles,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type AssistantState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'completed'
  | 'error'

interface AssistantStatusProps {
  state: AssistantState
}

const statusStyles: Record<
  AssistantState,
  {
    label: string
    icon: LucideIcon
    iconClassName: string
  }
> = {
  idle: {
    label: 'Ready',
    icon: Sparkles,
    iconClassName: 'text-emerald-300',
  },
  listening: {
    label: 'Listening…',
    icon: AudioLines,
    iconClassName: 'text-violet-300',
  },
  thinking: {
    label: 'Thinking…',
    icon: BrainCircuit,
    iconClassName: 'text-cyan-200',
  },
  executing: {
    label: 'Executing…',
    icon: Zap,
    iconClassName: 'text-amber-200',
  },
  completed: {
    label: 'Completed',
    icon: BadgeCheck,
    iconClassName: 'text-emerald-300',
  },
  error: {
    label: 'Error',
    icon: TriangleAlert,
    iconClassName: 'text-rose-300',
  },
}

export default function AssistantStatus({ state }: AssistantStatusProps) {
  const status = statusStyles[state]
  const StatusIcon = status.icon
  const isActive =
    state === 'listening' ||
    state === 'thinking' ||
    state === 'executing'

  return (
    <div
      className="jarvis-status inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] py-1.5 pl-1.5 pr-3.5 text-xs font-medium tracking-wide text-slate-100 shadow-lg shadow-black/10 backdrop-blur-xl"
      data-state={state}
      role="status"
      aria-live="polite"
    >
      <span
        className={`jarvis-status-icon flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] ${status.iconClassName}`}
        aria-hidden="true"
      >
        <StatusIcon className="h-3.5 w-3.5" />
      </span>
      <span>{status.label}</span>
      {isActive && (
        <span
          className="jarvis-status-dots flex items-center gap-1"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </span>
      )}
    </div>
  )
}
