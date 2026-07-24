export interface AssistantAction {
  type: string
  payload: Record<string, unknown>
}

export type AssistantActionHandler = (
  action: Readonly<AssistantAction>,
) => void | Promise<void>

const handlers = new Map<string, AssistantActionHandler>()

function logDevelopment(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Jarvis] ${message}`, detail)
  }
}

export function isAssistantAction(value: unknown): value is AssistantAction {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const action = value as Record<string, unknown>
  return (
    typeof action.type === 'string' &&
    action.type.trim().length > 0 &&
    typeof action.payload === 'object' &&
    action.payload !== null &&
    !Array.isArray(action.payload)
  )
}

export function registerHandler(
  actionType: string,
  handler: AssistantActionHandler,
): () => void {
  const normalizedType = actionType.trim()
  if (!normalizedType) {
    throw new TypeError('Assistant action types cannot be empty.')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('Assistant action handlers must be functions.')
  }
  if (handlers.has(normalizedType)) {
    throw new Error(
      `A handler is already registered for assistant action '${normalizedType}'.`,
    )
  }

  handlers.set(normalizedType, handler)

  return () => {
    if (handlers.get(normalizedType) === handler) {
      handlers.delete(normalizedType)
    }
  }
}

export async function dispatch(action: unknown): Promise<void> {
  if (!isAssistantAction(action)) {
    logDevelopment('Ignored an invalid assistant action.', action)
    return
  }

  const handler = handlers.get(action.type)
  if (!handler) {
    logDevelopment(`Ignored unknown assistant action '${action.type}'.`)
    return
  }

  try {
    await handler(action)
  } catch (error) {
    logDevelopment(
      `Handler for assistant action '${action.type}' failed.`,
      error,
    )
  }
}
