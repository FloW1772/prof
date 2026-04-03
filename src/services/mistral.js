const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const DEFAULT_MODEL = 'mistral-small-latest'

function buildApiErrorMessage(status, details) {
  if (!details) {
    return `Mistral API error (${status}).`
  }

  return `Mistral API error (${status}): ${details}`
}

export async function sendMessage(messages, systemPrompt = '') {
  const apiKey = import.meta.env.VITE_MISTRAL_KEY

  if (!apiKey) {
    throw new Error('Missing API key. Define VITE_MISTRAL_KEY in your environment.')
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('The messages argument must be a non-empty array.')
  }

  const isInvalidMessage = messages.some((message) => {
    return (
      !message ||
      typeof message.role !== 'string' ||
      typeof message.content !== 'string'
    )
  })

  if (isInvalidMessage) {
    throw new Error('Each message must contain string fields: role and content.')
  }

  const payloadMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  let response

  try {
    response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: payloadMessages,
      }),
    })
  } catch {
    throw new Error('Unable to reach Mistral API. Check your internet connection.')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(buildApiErrorMessage(response.status, 'Invalid JSON response'))
    }
  }

  if (!response.ok) {
    const details = data?.error?.message || data?.message || null
    throw new Error(buildApiErrorMessage(response.status, details))
  }

  const answer = data?.choices?.[0]?.message?.content

  if (!answer) {
    throw new Error('Mistral API returned an unexpected response format.')
  }

  return answer
}
