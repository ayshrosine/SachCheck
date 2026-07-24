'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { assistantClient } from '@/lib/assistant/client'

import AssistantHeader from './AssistantHeader'
import AssistantInput from './AssistantInput'
import AssistantStatus, { type AssistantState } from './AssistantStatus'

interface AssistantOverlayProps {
  open: boolean
  onClose: () => void
}

const EXECUTING_DELAY_MS = 900
const COMPLETED_DURATION_MS = 1600
const OVERLAY_TRANSITION_MS = 220

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function AssistantOverlay({
  open,
  onClose,
}: AssistantOverlayProps) {
  const [message, setMessage] = useState('')
  const [lastMessage, setLastMessage] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<AssistantState>('idle')
  const [shouldRender, setShouldRender] = useState(open)
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  const requestIdRef = useRef(0)
  const executingTimerRef = useRef<number | null>(null)
  const completedTimerRef = useRef<number | null>(null)
  const titleId = useId()
  const subtitleId = useId()
  const isBusy = state === 'thinking' || state === 'executing'

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    let animationFrame: number | undefined
    let transitionTimer: number | undefined

    if (open) {
      setShouldRender(true)
      animationFrame = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
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
  }, [open])

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      if (executingTimerRef.current !== null) {
        window.clearTimeout(executingTimerRef.current)
      }
      if (completedTimerRef.current !== null) {
        window.clearTimeout(completedTimerRef.current)
      }
    }
  }, [])

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
    if (!trimmedMessage || isBusy) {
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    if (completedTimerRef.current !== null) {
      window.clearTimeout(completedTimerRef.current)
      completedTimerRef.current = null
    }

    setLastMessage(trimmedMessage)
    setAssistantResponse('')
    setError('')
    setState('thinking')
    executingTimerRef.current = window.setTimeout(() => {
      if (requestIdRef.current === requestId) {
        setState('executing')
      }
    }, EXECUTING_DELAY_MS)

    try {
      const result = await assistantClient.sendMessage(trimmedMessage)
      if (!result.success) {
        throw new Error(result.response || 'Jarvis could not complete the request.')
      }

      if (executingTimerRef.current !== null) {
        window.clearTimeout(executingTimerRef.current)
        executingTimerRef.current = null
      }
      setAssistantResponse(result.response)
      setMessage('')
      setState('completed')
      completedTimerRef.current = window.setTimeout(() => {
        if (requestIdRef.current === requestId) {
          setState('idle')
        }
      }, COMPLETED_DURATION_MS)
    } catch (requestError) {
      if (executingTimerRef.current !== null) {
        window.clearTimeout(executingTimerRef.current)
        executingTimerRef.current = null
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Jarvis is unavailable right now.',
      )
      setState('error')
    }
  }

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className={`jarvis-overlay-backdrop fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto text-white ${
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

      <div className="jarvis-overlay-content relative flex min-h-[100dvh] flex-col">
        <AssistantHeader
          titleId={titleId}
          subtitleId={subtitleId}
          onClose={onClose}
        />

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-10">
          <div className="flex justify-center">
            <AssistantStatus state={state} />
          </div>

          <div
            className="flex flex-1 items-center justify-center py-8 sm:py-12"
            aria-live="polite"
          >
            {!lastMessage ? (
              <div className="max-w-xl text-center">
                <p className="text-3xl font-light tracking-tight text-slate-200 sm:text-5xl">
                  Ask. Verify. Understand.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  Your assistant response will appear here.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Your request
                </p>
                <p className="text-lg leading-8 text-slate-300">
                  {lastMessage}
                </p>

                <div className="mt-8 border-l border-cyan-300/30 pl-5 sm:pl-7">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                    Jarvis
                  </p>
                  {isBusy && (
                    <div className="flex items-center gap-3">
                      <span
                        className="jarvis-thinking-orb h-3 w-3 rounded-full bg-cyan-300"
                        aria-hidden="true"
                      />
                      <p className="jarvis-thinking-shimmer text-lg">
                        {state === 'thinking'
                          ? 'Reasoning through your request…'
                          : 'Executing the selected action…'}
                      </p>
                    </div>
                  )}
                  {assistantResponse && (
                    <p
                      className={`text-xl leading-8 text-white sm:text-2xl sm:leading-9 ${
                        state === 'completed'
                          ? 'jarvis-response-complete'
                          : ''
                      }`}
                    >
                      {assistantResponse}
                    </p>
                  )}
                  {error && (
                    <p className="text-lg leading-8 text-rose-300">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pb-2 sm:pb-4">
            <AssistantInput
              ref={inputRef}
              value={message}
              disabled={isBusy}
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
