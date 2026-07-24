import { ArrowUp } from 'lucide-react'
import { forwardRef, type FormEvent } from 'react'

interface AssistantInputProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

const AssistantInput = forwardRef<HTMLInputElement, AssistantInputProps>(
  function AssistantInput(
    {
      value,
      disabled,
      onChange,
      onSubmit,
    },
    ref,
  ) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onSubmit()
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 shadow-2xl shadow-black/25 backdrop-blur-xl transition-colors focus-within:border-cyan-300/50 focus-within:bg-white/[0.1]"
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Ask Jarvis anything..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          aria-label="Message Jarvis"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-4 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          aria-label="Send message"
        >
          <span className="hidden sm:inline">Send</span>
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    )
  },
)

export default AssistantInput
