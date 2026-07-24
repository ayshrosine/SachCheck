import { registerHandler } from '../dispatcher'

interface OverlayActionCallbacks {
  close: () => void | Promise<void>
  focusInput: () => void | Promise<void>
}

export function registerOverlayActionHandlers({
  close,
  focusInput,
}: OverlayActionCallbacks): () => void {
  const unregisterClose = registerHandler('close_overlay', close)

  try {
    const unregisterFocus = registerHandler('focus_input', focusInput)
    return () => {
      unregisterFocus()
      unregisterClose()
    }
  } catch (error) {
    unregisterClose()
    throw error
  }
}
