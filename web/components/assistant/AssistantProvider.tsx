'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

import { registerNavigationActionHandler } from '@/lib/assistant/actions/navigation'

import AssistantFloatingButton from './AssistantFloatingButton'
import AssistantOverlay from './AssistantOverlay'

export interface AssistantControls {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

interface AssistantProviderProps {
  children: ReactNode
}

const AssistantContext = createContext<AssistantControls | null>(null)

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function AssistantProvider({
  children,
}: AssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => {
    setIsOpen((current) => !current)
  }, [])

  useEffect(
    () => registerNavigationActionHandler((route) => router.push(route)),
    [router],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== 'j' ||
        (!event.metaKey && !event.ctrlKey) ||
        isEditableTarget(event.target)
      ) {
        return
      }

      event.preventDefault()
      toggle()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggle])

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [close, isOpen, open, toggle],
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantOverlay open={isOpen} onClose={close} />
      <AssistantFloatingButton open={isOpen} onToggle={toggle} />
    </AssistantContext.Provider>
  )
}

export function useAssistant(): AssistantControls {
  const context = useContext(AssistantContext)
  if (context === null) {
    throw new Error(
      'useAssistant must be used within an AssistantProvider.',
    )
  }
  return context
}
