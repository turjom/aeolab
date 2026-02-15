import { queryAI } from '../openrouter/client'

/**
 * Normalize business name by removing common suffixes and converting to lowercase
 */
function normalizeBusinessName(name: string): string {
  let normalized = name.toLowerCase().trim()
  
  // Remove common business suffixes (case insensitive)
  const suffixes = [
    /\s+llc\s*$/i,
    /\s+inc\.?\s*$/i,
    /\s+co\.?\s*$/i,
    /\s+ltd\.?\s*$/i,
    /\s+company\s*$/i,
    /\s+corp\.?\s*$/i,
    /\s+corporation\s*$/i,
  ]
  
  for (const suffix of suffixes) {
    normalized = normalized.replace(suffix, '')
  }
  
  return normalized.trim()
}

/**
 * Check if business name appears in response text using fuzzy matching
 */
function fuzzyStringMatch(businessName: string, responseText: string): boolean {
  const normalizedBusiness = normalizeBusinessName(businessName)
  const normalizedResponse = responseText.toLowerCase()
  
  // Direct match
  if (normalizedResponse.includes(normalizedBusiness)) {
    return true
  }
  
  // Try matching word by word (for multi-word business names)
  const businessWords = normalizedBusiness.split(/\s+/).filter(w => w.length > 2)
  if (businessWords.length > 1) {
    // Check if all significant words appear
    const allWordsFound = businessWords.every(word => normalizedResponse.includes(word))
    if (allWordsFound) {
      // Check if words appear close together (within 50 characters)
      const firstWordIndex = normalizedResponse.indexOf(businessWords[0])
      if (firstWordIndex !== -1) {
        const lastWordIndex = normalizedResponse.indexOf(
          businessWords[businessWords.length - 1],
          firstWordIndex
        )
        if (lastWordIndex !== -1 && lastWordIndex - firstWordIndex < 50) {
          return true
        }
      }
    }
  }
  
  return false
}

/**
 * Use AI to verify if business is mentioned
 */
async function aiVerification(
  businessName: string,
  responseText: string
): Promise<boolean> {
  try {
    const verificationPrompt = `Does this response mention the business '${businessName}'? Answer only: YES or NO.

Response: ${responseText}`

    const result = await queryAI(verificationPrompt, 'chatgpt')
    
    if (!result.success || !result.response_text) {
      console.error('[MentionDetector] AI verification failed:', result.error_message)
      return false
    }
    
    const answer = result.response_text.trim().toUpperCase()
    return answer.includes('YES')
  } catch (error) {
    console.error('[MentionDetector] Error in AI verification:', error)
    return false
  }
}

/**
 * Extract position of business mention in response
 */
function extractPosition(businessName: string, responseText: string): number | null {
  const normalizedBusiness = normalizeBusinessName(businessName)
  const normalizedResponse = responseText.toLowerCase()
  
  // Split into sentences
  const sentences = responseText.split(/[.!?]\s+/).filter(s => s.trim().length > 0)
  
  // Find first sentence that mentions the business
  let firstMentionIndex = -1
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].toLowerCase()
    if (sentence.includes(normalizedBusiness)) {
      firstMentionIndex = i
      break
    }
  }
  
  if (firstMentionIndex === -1) {
    return null
  }
  
  // Count recommendations before the mention
  // Look for common patterns: "1.", "First,", "•", "-", numbered lists
  let position = 1
  
  for (let i = 0; i < firstMentionIndex; i++) {
    const sentence = sentences[i]
    
    // Check for numbered list items
    if (/^\d+[.)]\s/.test(sentence.trim())) {
      position++
    }
    // Check for "First,", "Second,", etc.
    else if (/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)[,.]?\s/i.test(sentence.trim())) {
      position++
    }
    // Check for bullet points
    else if (/^[•\-\*]\s/.test(sentence.trim())) {
      position++
    }
    // Check for standalone business mentions (likely a recommendation)
    else if (sentence.trim().length > 20) {
      // If sentence is substantial, it might be a recommendation
      position++
    }
  }
  
  // If we found a clear numbered pattern, use that
  const mentionSentence = sentences[firstMentionIndex]
  const numberMatch = mentionSentence.match(/^(\d+)[.)]\s/)
  if (numberMatch) {
    const extractedPosition = parseInt(numberMatch[1], 10)
    if (extractedPosition > 0 && extractedPosition <= 10) {
      return extractedPosition
    }
  }
  
  // Return calculated position (minimum 1)
  return Math.max(1, position)
}

/**
 * Detect if a business is mentioned in an AI response
 * 
 * @param businessName - The business name to search for
 * @param responseText - The AI response text to search in
 * @param platform - The AI platform (for logging/debugging)
 * @returns Promise with appeared boolean and position (1-indexed or null)
 */
export async function detectBusinessMention(
  businessName: string,
  responseText: string,
  platform: 'chatgpt' | 'perplexity'
): Promise<{ appeared: boolean; position: number | null }> {
  try {
    // Step 1: String Match (fuzzy)
    const stringMatchFound = fuzzyStringMatch(businessName, responseText)
    
    if (stringMatchFound) {
      // Clear match found, extract position
      const position = extractPosition(businessName, responseText)
      console.log(`[MentionDetector] Business "${businessName}" found via string match at position ${position}`)
      return {
        appeared: true,
        position,
      }
    }
    
    // Step 2: AI Verification (if string match unclear)
    console.log(`[MentionDetector] String match unclear for "${businessName}", using AI verification...`)
    const aiVerified = await aiVerification(businessName, responseText)
    
    if (!aiVerified) {
      return {
        appeared: false,
        position: null,
      }
    }
    
    // Step 3: Position Extraction (if appeared = true)
    const position = extractPosition(businessName, responseText)
    console.log(`[MentionDetector] Business "${businessName}" verified via AI at position ${position}`)
    
    return {
      appeared: true,
      position,
    }
  } catch (error) {
    // Graceful degradation - log error but return false
    console.error('[MentionDetector] Error detecting mention:', error)
    return {
      appeared: false,
      position: null,
    }
  }
}
