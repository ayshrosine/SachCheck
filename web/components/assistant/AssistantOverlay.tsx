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
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const subtitleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

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
    if (!trimmedMessage || state === 'thinking') {
      return
    }

    setLastMessage(trimmedMessage)
    setAssistantResponse('')
    setError('')
    setState('thinking')

    try {
      const result = await assistantClient.sendMessage(trimmedMessage)
      if (!result.success) {
        throw new Error(result.response || 'Jarvis could not complete the request.')
      }

      setAssistantResponse(result.response)
      setMessage('')
      setState('completed')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Jarvis is unavailable right now.',
      )
      setState('error')
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto bg-slate-950/85 text-white backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
    >
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex min-h-[100dvh] flex-col">
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
                  {state === 'thinking' && (
                    <p className="text-lg text-slate-400">
                      Working on your request…
                    </p>
                  )}
                  {assistantResponse && (
                    <p className="text-xl leading-8 text-white sm:text-2xl sm:leading-9">
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
              disabled={state === 'thinking'}
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
