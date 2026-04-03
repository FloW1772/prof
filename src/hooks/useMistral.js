import { useCallback, useState } from 'react'
import { sendMessage } from '../services/mistral'

export function useMistral() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const send = useCallback(async (messages, systemPrompt = '') => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await sendMessage(messages, systemPrompt)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while calling Mistral API.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { send, isLoading, error }
}
