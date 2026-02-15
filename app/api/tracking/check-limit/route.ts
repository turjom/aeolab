import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Query manual_tracking_runs for last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: recentRuns, error: runsError } = await supabase
      .from('manual_tracking_runs')
      .select('run_at')
      .eq('user_id', user.id)
      .gte('run_at', twentyFourHoursAgo.toISOString())
      .order('run_at', { ascending: true })

    if (runsError) {
      console.error('[CheckLimit] Error querying manual_tracking_runs:', runsError)
      return NextResponse.json(
        { error: 'Failed to check rate limit' },
        { status: 500 }
      )
    }

    const count = recentRuns?.length || 0
    const remainingRuns = Math.max(0, 2 - count)

    let resetHours = 0
    if (count > 0 && recentRuns && recentRuns.length > 0) {
      const oldestRun = recentRuns[0].run_at
      if (oldestRun) {
        const oldestRunDate = new Date(oldestRun)
        const expiresAt = new Date(oldestRunDate.getTime() + 24 * 60 * 60 * 1000)
        const now = new Date()
        const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        resetHours = Math.ceil(Math.max(0, hoursRemaining))
      }
    }

    return NextResponse.json({
      remainingRuns,
      resetHours,
    })
  } catch (error) {
    console.error('[CheckLimit] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
