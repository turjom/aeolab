import { OpenRouterRequest, OpenRouterResponse, TrackingResult } from './types'


function getApiKey(): string{
    const key = process.env.OPENROUTER_API_KEY
    if (!key) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set')
    }
    return key
  }

const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
function getSiteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

// Delay helper for exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Get model name based on platform
function getModel(platform: 'chatgpt' | 'perplexity'): string {
  switch (platform) {
    case 'chatgpt':
      return 'openai/gpt-4o-mini'
    case 'perplexity':
      return 'perplexity/sonar'
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

// Check if error should trigger retry
function shouldRetry(statusCode: number | undefined, error: Error): boolean {
  // Retry on timeout
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true
  }

  // Retry on rate limit (429)
  if (statusCode === 429) {
    return true
  }

  // Retry on server errors (5xx)
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true
  }

  // Don't retry on client errors (4xx) except 429
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return false
  }

  // Retry on network errors
  return true
}

// Make API request with timeout
async function makeRequest(
  requestBody: OpenRouterRequest,
  timeoutMs: number = 30000
): Promise<Response> {

  const OPENROUTER_API_KEY = getApiKey()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': getSiteUrl(),
        'X-Title': 'AEOLab',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds')
    }
    throw error
  }
}

/**
 * Query AI platform (ChatGPT or Perplexity) via OpenRouter
 * 
 * @param prompt - The prompt text to send to the AI
 * @param platform - Either 'chatgpt' or 'perplexity'
 * @returns Promise<TrackingResult> with response or error
 */
export async function queryAI(
  prompt: string,
  platform: 'chatgpt' | 'perplexity'
): Promise<TrackingResult> {
  const model = getModel(platform)
  const maxRetries = 3
  const backoffDelays = [1000, 2000, 4000] // 1s, 2s, 4s

  const requestBody: OpenRouterRequest = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  }

  let lastError: Error | null = null
  let lastStatusCode: number | undefined = undefined

  // Retry loop
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await makeRequest(requestBody, 30000)
      lastStatusCode = response.status

      // Handle successful response
      if (response.ok) {
        try {
          const data: OpenRouterResponse = await response.json()

          // Extract response text
          const responseText =
            data.choices?.[0]?.message?.content || null

          // Extract token usage
          const tokensUsed = data.usage?.total_tokens || null

          return {
            success: true,
            response_text: responseText,
            error_message: null,
            tokens_used: tokensUsed,
          }
        } catch (parseError) {
          // JSON parse error
          return {
            success: false,
            response_text: null,
            error_message: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            tokens_used: null,
          }
        }
      }

      // Handle error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch {
        // Ignore JSON parse errors for error response
      }

      lastError = new Error(errorMessage)

      // Check if we should retry
      if (!shouldRetry(response.status, lastError)) {
        return {
          success: false,
          response_text: null,
          error_message: errorMessage,
          tokens_used: null,
        }
      }
    } catch (error) {
      // Network or timeout error
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Check if we should retry
      if (!shouldRetry(undefined, lastError)) {
        return {
          success: false,
          response_text: null,
          error_message: lastError.message,
          tokens_used: null,
        }
      }
    }

    // If we get here, we should retry
    if (attempt < maxRetries - 1) {
      const delayMs = backoffDelays[attempt] || 4000
      await delay(delayMs)
    }
  }

  // All retries exhausted
  return {
    success: false,
    response_text: null,
    error_message: lastError
      ? `Failed after ${maxRetries} attempts: ${lastError.message}`
      : `Failed after ${maxRetries} attempts`,
    tokens_used: null,
  }
}
