import {
  dispatch,
  isAssistantAction,
  type AssistantAction,
} from './dispatcher'

export type { AssistantAction } from './dispatcher'

export interface AssistantRequest {
  message: string
  clarification_id?: string
}

export interface AssistantClarification {
  id: string
  question: string
  missing_parameters: string[]
}

export interface AssistantResponse {
  success: boolean
  response: string
  action?: AssistantAction | null
  clarification?: AssistantClarification | null
}

export class AssistantClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'AssistantClientError'
  }
}

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

function isAssistantResponse(value: unknown): value is AssistantResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const response = value as Record<string, unknown>
  const action = response.action
  const clarification = response.clarification
  return (
    typeof response.success === 'boolean' &&
    typeof response.response === 'string' &&
    (action === undefined || action === null || isAssistantAction(action)) &&
    (clarification === undefined ||
      clarification === null ||
      isAssistantClarification(clarification))
  )
}

function isAssistantClarification(
  value: unknown,
): value is AssistantClarification {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const clarification = value as Record<string, unknown>
  return (
    typeof clarification.id === 'string' &&
    clarification.id.length > 0 &&
    typeof clarification.question === 'string' &&
    clarification.question.length > 0 &&
    Array.isArray(clarification.missing_parameters) &&
    clarification.missing_parameters.every(
      (parameter) => typeof parameter === 'string',
    )
  )
}

function getErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const error = value as Record<string, unknown>
  if (typeof error.message === 'string') {
    return error.message
  }
  if (typeof error.detail === 'string') {
    return error.detail
  }
  if (typeof error.detail === 'object' && error.detail !== null) {
    const detail = error.detail as Record<string, unknown>
    if (typeof detail.message === 'string') {
      return detail.message
    }
  }

  return undefined
}

export async function sendMessage(
  message: string,
  clarificationId?: string,
): Promise<AssistantResponse> {
  const request: AssistantRequest = {
    message,
    ...(clarificationId
      ? { clarification_id: clarificationId }
      : {}),
  }
  let response: Response

  try {
    response = await fetch(`${apiUrl}/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  } catch {
    throw new AssistantClientError('Unable to reach the assistant service.')
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new AssistantClientError(
      getErrorMessage(payload) ||
        `Assistant request failed with status ${response.status}.`,
      response.status,
    )
  }

  if (!isAssistantResponse(payload)) {
    throw new AssistantClientError(
      'The assistant service returned an invalid response.',
      response.status,
    )
  }

  if (payload.action) {
    await dispatch(payload.action)
  }

  return payload
}

export const assistantClient = {
  sendMessage,
}
