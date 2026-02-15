'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function TrialBanner() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isTrial, setIsTrial] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.log('[TrialBanner] Component mounting')
    
    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem('trialBannerDismissed')
    console.log('[TrialBanner] Dismissed status:', dismissed)
    if (dismissed === 'true') {
      setIsDismissed(true)
      setLoading(false)
      return
    }

    async function loadTrialData() {
      try {
        console.log('[TrialBanner] Loading trial data...')
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.log('[TrialBanner] No user found:', userError)
          setLoading(false)
          return
        }

        console.log('[TrialBanner] User ID:', user.id)

        // Fetch user subscription
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('subscription_status, trial_ends_at')
          .eq('user_id', user.id)
          .single()

        console.log('[TrialBanner] Subscription data:', subscription)
        console.log('[TrialBanner] Subscription error:', subError)

        if (subError || !subscription) {
          console.log('[TrialBanner] No subscription found')
          setLoading(false)
          return
        }

        // Check if trial
        if (subscription.subscription_status === 'trial') {
          console.log('[TrialBanner] User is on trial')
          setIsTrial(true)
          
          // Calculate days remaining
          const trialEndDate = new Date(subscription.trial_ends_at)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          trialEndDate.setHours(0, 0, 0, 0)
          
          const diffTime = trialEndDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          console.log('[TrialBanner] Trial ends at:', subscription.trial_ends_at)
          console.log('[TrialBanner] Days remaining:', diffDays)
          
          if (diffDays < 0) {
            setIsExpired(true)
            setDaysRemaining(0)
            console.log('[TrialBanner] Trial has expired')
          } else {
            setDaysRemaining(diffDays)
            console.log('[TrialBanner] Trial active,', diffDays, 'days remaining')
          }
        } else {
          console.log('[TrialBanner] User is not on trial, status:', subscription.subscription_status)
        }

        setLoading(false)
      } catch (err) {
        console.error('[TrialBanner] Error loading trial data:', err)
        setLoading(false)
      }
    }

    loadTrialData()
  }, [supabase])

  const handleDismiss = () => {
    sessionStorage.setItem('trialBannerDismissed', 'true')
    setIsDismissed(true)
  }

  console.log('[TrialBanner] Render check - loading:', loading, 'dismissed:', isDismissed, 'isTrial:', isTrial, 'daysRemaining:', daysRemaining)

  if (loading || isDismissed || !isTrial) {
    console.log('[TrialBanner] Not rendering - returning null')
    return null
  }

  console.log('[TrialBanner] Rendering banner')

  return (
    <div className="sticky top-0 z-40 bg-amber-100 border-b border-amber-300 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <p className="text-sm text-amber-900 font-medium">
          {isExpired ? (
            'Trial ended - Upgrade to continue'
          ) : (
            `Trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-900 hover:bg-amber-200"
        aria-label="Dismiss banner"
      >
        ×
      </Button>
    </div>
  )
}
