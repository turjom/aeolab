import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runTrackingForBusiness } from '@/lib/tracking/tracking-service'

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body - JSON expected' },
        { status: 400 }
      )
    }

    const { businessId } = body

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'businessId is required and must be a string' },
        { status: 400 }
      )
    }

    // Verify business belongs to authenticated user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, user_id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 403 }
      )
    }

    // Rate limiting: Check manual tracking runs in last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: recentRuns, error: runsError } = await supabase
      .from('manual_tracking_runs')
      .select('run_at')
      .eq('user_id', user.id)
      .gte('run_at', twentyFourHoursAgo.toISOString())
      .order('run_at', { ascending: true })

    if (runsError) {
      console.error('[TrackingAPI] Error checking rate limit:', runsError)
      // Continue anyway if we can't check rate limit (graceful degradation)
    }

    const runCount = recentRuns?.length || 0

    if (runCount >= 2) {
      // Calculate hours until oldest run expires
      const oldestRun = recentRuns?.[0]?.run_at
      let hoursUntilRetry = 24

      if (oldestRun) {
        const oldestRunDate = new Date(oldestRun)
        const expiresAt = new Date(oldestRunDate.getTime() + 24 * 60 * 60 * 1000)
        const now = new Date()
        const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        hoursUntilRetry = Math.ceil(Math.max(0, hoursRemaining))
      }

      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You can run manual tracking 2 times per day. Try again in ${hoursUntilRetry} hour${hoursUntilRetry !== 1 ? 's' : ''}.`,
        },
        { status: 429 }
      )
    }

    // Run tracking for the business
    const result = await runTrackingForBusiness(businessId)

    if (result.success) {
      // Record this manual tracking run
      const { error: insertError } = await supabase
        .from('manual_tracking_runs')
        .insert({
          user_id: user.id,
          business_id: businessId,
          run_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('[TrackingAPI] Error recording manual tracking run:', insertError)
        // Don't fail the request if we can't record the run
      }

      const remainingRuns = 2 - runCount - 1

      return NextResponse.json({
        success: true,
        results: result.results,
        errors: result.errors,
        remainingRuns: Math.max(0, remainingRuns),
        message: `Tracking completed: ${result.results} successful checks, ${result.errors} errors`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Tracking failed: ${result.errors} errors occurred`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[TrackingAPI] Error in manual tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
