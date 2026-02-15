import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runTrackingForBusiness } from '@/lib/tracking/tracking-service'

export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET environment variable not set')
      return NextResponse.json(
        { success: false, error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Environment check
    const cronEnabled = process.env.CRON_ENABLED
    if (cronEnabled !== 'true') {
      console.log('[Cron] Cron disabled via environment variable')
      return NextResponse.json({
        success: true,
        message: 'Cron disabled',
        processed: 0,
        errors: 0,
        skipped: 0,
      })
    }

    // Database check
    const supabase = await createClient()
    const { data: config, error: configError } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'cron_enabled')
      .single()

    if (!configError && config && config.value !== 'true') {
      console.log('[Cron] Cron disabled via database config')
      return NextResponse.json({
        success: true,
        message: 'Cron disabled via database',
        processed: 0,
        errors: 0,
        skipped: 0,
      })
    }

    // Find businesses that need tracking
    const now = new Date().toISOString()
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, user_id, next_check_date, last_checked_at')
      .lte('next_check_date', now)

    if (businessesError) {
      console.error('[Cron] Error fetching businesses:', businessesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch businesses' },
        { status: 500 }
      )
    }

    if (!businesses || businesses.length === 0) {
      console.log('[Cron] No businesses need tracking')
      return NextResponse.json({
        success: true,
        processed: 0,
        errors: 0,
        skipped: 0,
        message: 'No businesses need tracking',
      })
    }

    console.log(`[Cron] Found ${businesses.length} businesses to check`)

    let processed = 0
    let errors = 0
    let skipped = 0

    // Process each business
    for (const business of businesses) {
      try {
        // Get subscription status
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('subscription_status')
          .eq('user_id', business.user_id)
          .single()

        if (subError || !subscription) {
          console.log(`[Cron] No subscription found for business ${business.id}, skipping`)
          skipped++
          continue
        }

        // Determine frequency based on subscription status
        const isTrial = subscription.subscription_status === 'trial'
        const frequencyHours = isTrial ? 24 : 168 // 24 hours for trial, 7 days (168 hours) for active

        // Check if last_checked_at is too recent
        if (business.last_checked_at) {
          const lastChecked = new Date(business.last_checked_at)
          const now = new Date()
          const hoursSinceLastCheck =
            (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)

          if (hoursSinceLastCheck < frequencyHours) {
            console.log(
              `[Cron] Business ${business.id} checked too recently (${hoursSinceLastCheck.toFixed(1)} hours ago), skipping`
            )
            skipped++
            continue
          }
        }

        // Run tracking for this business
        console.log(`[Cron] Processing business ${business.id}`)
        const result = await runTrackingForBusiness(business.id)

        if (result.success) {
          processed++
          console.log(
            `[Cron] Business ${business.id} processed: ${result.results} results, ${result.errors} errors`
          )
        } else {
          errors++
          console.error(`[Cron] Business ${business.id} failed: ${result.errors} errors`)
        }
      } catch (businessError) {
        errors++
        console.error(`[Cron] Error processing business ${business.id}:`, businessError)
        // Continue to next business
        continue
      }
    }

    const summary = {
      success: true,
      processed,
      errors,
      skipped,
      message: `Processed ${processed} businesses, ${errors} errors, ${skipped} skipped`,
    }

    console.log('[Cron] Summary:', summary)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
