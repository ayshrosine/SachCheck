'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { registerOverlayActionHandlers } from '@/lib/assistant/actions/overlay'
import { assistantClient } from '@/lib/assistant/client'

import AssistantHeader from './AssistantHeader'
import AssistantInput from './AssistantInput'
import AssistantStatus from './AssistantStatus'
import { useExecutionProgress } from './useExecutionProgress'

interface AssistantOverlayProps {
  open: boolean
  onClose: () => void
}

type ConversationRole = 'user' | 'assistant'

interface ConversationMessage {
  id: string
  role: ConversationRole
  content: string
  timestamp: Date
}

const OVERLAY_TRANSITION_MS = 220

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function createConversationMessage(
  role: ConversationRole,
  content: string,
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
  }
}

function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AssistantOverlay({
  open,
  onClose,
}: AssistantOverlayProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [error, setError] = useState('')
  const [shouldFocusInput, setShouldFocusInput] = useState(false)
  const [shouldRender, setShouldRender] = useState(open)
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  const sessionIdRef = useRef(0)
  const titleId = useId()
  const subtitleId = useId()
  const execution = useExecutionProgress()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    return registerOverlayActionHandlers({
      close: () => onCloseRef.current(),
      focusInput: () => setShouldFocusInput(true),
    })
  }, [open])

  useEffect(() => {
    if (!open || execution.isActive || !shouldFocusInput) {
      return
    }

    setShouldFocusInput(false)
    inputRef.current?.focus()
  }, [execution.isActive, open, shouldFocusInput])

  useEffect(() => {
    let animationFrame: number | undefined
    let transitionTimer: number | undefined

    if (open) {
      setShouldRender(true)
      animationFrame = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      sessionIdRef.current += 1
      setMessage('')
      setMessages([])
      setError('')
      setShouldFocusInput(false)
      execution.reset()
      setIsVisible(false)
      transitionTimer = window.setTimeout(() => {
        setShouldRender(false)
      }, OVERLAY_TRANSITION_MS)
    }

    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
      if (transitionTimer !== undefined) {
        window.clearTimeout(transitionTimer)
      }
    }
  }, [open, execution.reset])

  useEffect(() => {
    if (!open || !conversationRef.current) {
      return
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const conversation = conversationRef.current
      if (!conversation) {
        return
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      conversation.scrollTo({
        top: conversation.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [execution.stage, messages, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !overlayRef.current) {
        return
      }

      const focusableElements = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      )
      if (focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open])

  const handleSubmit = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || execution.isActive) {
      return
    }

    const sessionId = sessionIdRef.current
    setMessages((currentMessages) => [
      ...currentMessages,
      createConversationMessage('user', trimmedMessage),
    ])
    setMessage('')
    setError('')
    execution.start()

    try {
      const result = await assistantClient.sendMessage(trimmedMessage)
      if (sessionIdRef.current !== sessionId) {
        return
      }
      if (!result.success) {
        throw new Error(result.response || 'Jarvis could not complete the request.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        createConversationMessage('assistant', result.response),
      ])
      execution.complete()
    } catch (requestError) {
      if (sessionIdRef.current !== sessionId) {
        return
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Jarvis is unavailable right now.',
      )
      execution.fail()
    }
  }

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className={`jarvis-overlay-backdrop fixed inset-0 z-[100] min-h-[100dvh] overflow-hidden text-white ${
        isVisible
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      data-visible={isVisible}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      aria-hidden={!open}
    >
      <div
        className="jarvis-ambient jarvis-ambient-one pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="jarvis-ambient jarvis-ambient-two pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="jarvis-overlay-content relative flex h-[100dvh] flex-col">
        <AssistantHeader
          titleId={titleId}
          subtitleId={subtitleId}
          onClose={onClose}
        />

        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-10">
          <div
            key={execution.stage}
            className="jarvis-stage-transition flex justify-center"
          >
            <AssistantStatus
              state={execution.state}
              label={execution.label}
            />
          </div>

          <div
            ref={conversationRef}
            className="jarvis-conversation-scroll min-h-0 flex-1 overflow-y-auto py-8 sm:py-10"
          >
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end">
              {messages.length === 0 && !execution.isActive && !error ? (
                <div className="my-auto max-w-xl self-center text-center">
                  <p className="text-3xl font-light tracking-tight text-slate-200 sm:text-5xl">
                    Ask. Verify. Understand.
                  </p>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                    Your assistant response will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <ol
                    className="space-y-6"
                    role="log"
                    aria-label="Jarvis conversation"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {messages.map((conversationMessage) => (
                      <li
                        key={conversationMessage.id}
                        className="jarvis-stage-transition"
                      >
                        <article
                          className={`rounded-r-2xl border-l py-3 pl-5 pr-3 sm:pl-7 ${
                            conversationMessage.role === 'assistant'
                              ? 'border-cyan-300/30 bg-gradient-to-r from-cyan-400/[0.06] to-transparent'
                              : 'border-indigo-300/20'
                          }`}
                        >
                          <header className="mb-2 flex items-center justify-between gap-4">
                            <span
                              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                                conversationMessage.role === 'assistant'
                                  ? 'text-cyan-300/70'
                                  : 'text-slate-500'
                              }`}
                            >
                              {conversationMessage.role === 'assistant'
                                ? 'Jarvis'
                                : 'You'}
                            </span>
                            <time
                              className="text-[11px] text-slate-600"
                              dateTime={conversationMessage.timestamp.toISOString()}
                            >
                              {formatTimestamp(conversationMessage.timestamp)}
                            </time>
                          </header>
                          <p
                            className={`whitespace-pre-wrap break-words ${
                              conversationMessage.role === 'assistant'
                                ? 'text-xl leading-8 text-white sm:text-2xl sm:leading-9'
                                : 'text-base leading-7 text-slate-300 sm:text-lg'
                            }`}
                          >
                            {conversationMessage.content}
                          </p>
                        </article>
                      </li>
                    ))}
                  </ol>

                  {execution.isActive && (
                    <div
                      key={execution.stage}
                      className="jarvis-stage-transition mt-7 flex items-center gap-3 border-l border-cyan-300/20 py-2 pl-5 sm:pl-7"
                      aria-hidden="true"
                    >
                      <span
                        className="jarvis-thinking-orb h-3 w-3 rounded-full bg-cyan-300"
                        aria-hidden="true"
                      />
                      <p className="jarvis-thinking-shimmer text-lg">
                        {execution.label}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div
                      className="jarvis-stage-transition mt-7 border-l border-rose-300/30 py-2 pl-5 text-lg leading-8 text-rose-300 sm:pl-7"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 pb-2 pt-3 sm:pb-4">
            <AssistantInput
              ref={inputRef}
              value={message}
              disabled={execution.isActive}
              onChange={setMessage}
              onSubmit={handleSubmit}
            />
            <p className="mt-3 text-center text-xs text-slate-600">
              Press Enter to send · Esc to close
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
