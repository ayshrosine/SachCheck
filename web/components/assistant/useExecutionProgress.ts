'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AssistantState } from './AssistantStatus'

export type ExecutionStage =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'executing'
  | 'preparing'
  | 'completed'
  | 'error'

interface StageDefinition {
  stage: ExecutionStage
  duration: number | null
}

const ACTIVE_STAGE_SEQUENCE: readonly StageDefinition[] = [
  {
    stage: 'understanding',
    duration: 500,
  },
  {
    stage: 'planning',
    duration: 700,
  },
  {
    stage: 'executing',
    duration: 1000,
  },
  {
    stage: 'preparing',
    duration: null,
  },
]

const COMPLETED_DURATION_MS = 1600

const stageLabels: Record<ExecutionStage, string> = {
  idle: 'Ready',
  understanding: 'Understanding your request…',
  planning: 'Planning actions…',
  executing: 'Executing…',
  preparing: 'Preparing response…',
  completed: 'Completed',
  error: 'Error',
}

const visualStates: Record<ExecutionStage, AssistantState> = {
  idle: 'idle',
  understanding: 'thinking',
  planning: 'thinking',
  executing: 'executing',
  preparing: 'thinking',
  completed: 'completed',
  error: 'error',
}

export function useExecutionProgress() {
  const [stage, setStage] = useState<ExecutionStage>('idle')
  const sequenceIdRef = useRef(0)
  const stageTimerRef = useRef<number | null>(null)
  const completedTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current)
      stageTimerRef.current = null
    }
    if (completedTimerRef.current !== null) {
      window.clearTimeout(completedTimerRef.current)
      completedTimerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimers()
    const sequenceId = sequenceIdRef.current + 1
    sequenceIdRef.current = sequenceId

    const advance = (index: number) => {
      if (sequenceIdRef.current !== sequenceId) {
        return
      }

      const definition = ACTIVE_STAGE_SEQUENCE[index]
      if (!definition) {
        return
      }

      setStage(definition.stage)
      if (definition.duration === null) {
        stageTimerRef.current = null
        return
      }

      stageTimerRef.current = window.setTimeout(() => {
        stageTimerRef.current = null
        advance(index + 1)
      }, definition.duration)
    }

    advance(0)
  }, [clearTimers])

  const complete = useCallback(() => {
    clearTimers()
    const sequenceId = sequenceIdRef.current + 1
    sequenceIdRef.current = sequenceId
    setStage('completed')

    completedTimerRef.current = window.setTimeout(() => {
      if (sequenceIdRef.current === sequenceId) {
        completedTimerRef.current = null
        setStage('idle')
      }
    }, COMPLETED_DURATION_MS)
  }, [clearTimers])

  const fail = useCallback(() => {
    clearTimers()
    sequenceIdRef.current += 1
    setStage('error')
  }, [clearTimers])

  useEffect(() => {
    return () => {
      sequenceIdRef.current += 1
      clearTimers()
    }
  }, [clearTimers])

  return {
    stage,
    state: visualStates[stage],
    label: stageLabels[stage],
    isActive:
      stage === 'understanding' ||
      stage === 'planning' ||
      stage === 'executing' ||
      stage === 'preparing',
    start,
    complete,
    fail,
  }
}
