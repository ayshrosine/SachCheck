import { registerHandler } from '../dispatcher'

type Navigate = (route: string) => void | Promise<void>

const INTERNAL_ORIGIN = 'https://assistant.internal'

function getInternalRoute(payload: Record<string, unknown>): string | null {
  const route = payload.route
  if (
    typeof route !== 'string' ||
    route !== route.trim() ||
    !route.startsWith('/') ||
    route.startsWith('//') ||
    route.includes('\\')
  ) {
    return null
  }

  try {
    const url = new URL(route, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) {
      return null
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function registerNavigationActionHandler(
  navigate: Navigate,
): () => void {
  return registerHandler('navigate', ({ payload }) => {
    const route = getInternalRoute(payload)
    if (!route) {
      return
    }
    return navigate(route)
  })
}
