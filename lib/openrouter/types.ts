// OpenRouter API Request Types
export interface OpenRouterMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature: number
  max_tokens: number
}

// OpenRouter API Response Types
export interface OpenRouterChoice {
  message: {
    role: string
    content: string
  }
}

export interface OpenRouterUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: OpenRouterChoice[]
  usage: OpenRouterUsage
}

// Tracking Result Type
export interface TrackingResult {
  success: boolean
  response_text: string | null
  error_message: string | null
  tokens_used: number | null
}
