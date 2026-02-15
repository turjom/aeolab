import { queryAI } from '../openrouter/client'
import { detectBusinessMention } from '../detection/mention-detector'
import { createClient } from '../supabase/server'

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface TrackingSummary {
  success: boolean
  results: number
  errors: number
}

/**
 * Run tracking for a business - queries AI platforms and records results
 * 
 * @param businessId - The business ID to track
 * @returns Promise with tracking summary
 */
export async function runTrackingForBusiness(
  businessId: string
): Promise<TrackingSummary> {
  const supabase = await createClient()
  let resultsCount = 0
  let errorsCount = 0

  try {
    // Get business info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, business_name')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      console.error('[TrackingService] Business not found:', businessError)
      return { success: false, results: 0, errors: 0 }
    }

    console.log(`[TrackingService] Starting tracking for business: ${business.business_name}`)

    // Get all active tracked prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('tracked_prompts')
      .select('id, prompt_text')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (promptsError || !prompts || prompts.length === 0) {
      console.error('[TrackingService] No active prompts found:', promptsError)
      return { success: false, results: 0, errors: 0 }
    }

    console.log(`[TrackingService] Found ${prompts.length} active prompts`)

    // Process each prompt
    for (const prompt of prompts) {
      try {
        // Query ChatGPT
        console.log(`[TrackingService] Querying ChatGPT for prompt: ${prompt.id}`)
        const chatgptResult = await queryAI(prompt.prompt_text, 'chatgpt')

        if (chatgptResult.success && chatgptResult.response_text) {
          // Detect business mention
          const detection = await detectBusinessMention(
            business.business_name,
            chatgptResult.response_text,
            'chatgpt'
          )

          // Insert tracking result
          const { error: insertError } = await supabase
            .from('tracking_results')
            .insert({
              prompt_id: prompt.id,
              ai_platform: 'chatgpt',
              appeared: detection.appeared,
              position: detection.position,
              full_response_text: chatgptResult.response_text,
              status: 'success',
              error_message: null,
              tracked_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('[TrackingService] Error inserting ChatGPT result:', insertError)
            errorsCount++
          } else {
            resultsCount++
            console.log(
              `[TrackingService] ChatGPT result saved - appeared: ${detection.appeared}, position: ${detection.position}`
            )
          }
        } else {
          // Failed query
          const { error: insertError } = await supabase
            .from('tracking_results')
            .insert({
              prompt_id: prompt.id,
              ai_platform: 'chatgpt',
              appeared: null,
              position: null,
              full_response_text: null,
              status: 'failed',
              error_message: chatgptResult.error_message || 'Unknown error',
              tracked_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('[TrackingService] Error inserting ChatGPT failure:', insertError)
            errorsCount++
          } else {
            errorsCount++
            console.log(`[TrackingService] ChatGPT query failed: ${chatgptResult.error_message}`)
          }
        }

        // Wait 500ms before next query
        await delay(500)

        // Query Perplexity
        console.log(`[TrackingService] Querying Perplexity for prompt: ${prompt.id}`)
        const perplexityResult = await queryAI(prompt.prompt_text, 'perplexity')

        if (perplexityResult.success && perplexityResult.response_text) {
          // Detect business mention
          const detection = await detectBusinessMention(
            business.business_name,
            perplexityResult.response_text,
            'perplexity'
          )

          // Insert tracking result
          const { error: insertError } = await supabase
            .from('tracking_results')
            .insert({
              prompt_id: prompt.id,
              ai_platform: 'perplexity',
              appeared: detection.appeared,
              position: detection.position,
              full_response_text: perplexityResult.response_text,
              status: 'success',
              error_message: null,
              tracked_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('[TrackingService] Error inserting Perplexity result:', insertError)
            errorsCount++
          } else {
            resultsCount++
            console.log(
              `[TrackingService] Perplexity result saved - appeared: ${detection.appeared}, position: ${detection.position}`
            )
          }
        } else {
          // Failed query
          const { error: insertError } = await supabase
            .from('tracking_results')
            .insert({
              prompt_id: prompt.id,
              ai_platform: 'perplexity',
              appeared: null,
              position: null,
              full_response_text: null,
              status: 'failed',
              error_message: perplexityResult.error_message || 'Unknown error',
              tracked_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('[TrackingService] Error inserting Perplexity failure:', insertError)
            errorsCount++
          } else {
            errorsCount++
            console.log(`[TrackingService] Perplexity query failed: ${perplexityResult.error_message}`)
          }
        }

        // Wait 500ms before next prompt
        await delay(500)
      } catch (promptError) {
        // Log error but continue to next prompt
        console.error(`[TrackingService] Error processing prompt ${prompt.id}:`, promptError)
        errorsCount++
        continue
      }
    }

    // Update business last_checked_at and next_check_date
    const now = new Date()
    const nextCheckDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        last_checked_at: now.toISOString(),
        next_check_date: nextCheckDate.toISOString(),
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('[TrackingService] Error updating business:', updateError)
      // Don't fail entire operation if update fails
    } else {
      console.log(`[TrackingService] Business updated - next check: ${nextCheckDate.toISOString()}`)
    }

    console.log(
      `[TrackingService] Tracking completed - Results: ${resultsCount}, Errors: ${errorsCount}`
    )

    return {
      success: true,
      results: resultsCount,
      errors: errorsCount,
    }
  } catch (error) {
    console.error('[TrackingService] Fatal error in tracking:', error)
    return {
      success: false,
      results: resultsCount,
      errors: errorsCount,
    }
  }
}
