'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generatePrompts } from '@/lib/prompts/generator'

export default function ReviewPage() {
  const [business, setBusiness] = useState<any>(null)
  const [prompts, setPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadBusinessAndPrompts() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('You must be logged in to continue')
          setLoading(false)
          return
        }

        // Fetch business for current user
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (businessError || !businessData) {
          setError('Business information not found. Please complete the setup form.')
          setLoading(false)
          return
        }

        setBusiness(businessData)

        // Determine country from location (if location is "Singapore", country is Singapore, else US)
        const country = businessData.location === 'Singapore' 
          ? 'Singapore' 
          : 'United States'

        // Generate prompts
        const generatedPrompts = generatePrompts(
          businessData.business_name,
          businessData.industry,
          country,
          businessData.location
        )

        setPrompts(generatedPrompts)
        setLoading(false)
      } catch (err) {
        setError('An error occurred while loading your information.')
        setLoading(false)
      }
    }

    loadBusinessAndPrompts()
  }, [supabase])

  const handleStartTracking = async () => {
    if (!business) return

    setSaving(true)
    setError(null)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('You must be logged in to continue')
        setSaving(false)
        return
      }

      console.log('[ReviewPage] Starting tracking setup...')
      console.log('[ReviewPage] Business ID:', business.id)
      console.log('[ReviewPage] Number of prompts:', prompts.length)

      // Delete any existing prompts for this business (in case setup page already created them)
      console.log('[ReviewPage] Deleting existing prompts...')
      await supabase
        .from('tracked_prompts')
        .delete()
        .eq('business_id', business.id)

      // Save all prompts to tracked_prompts table
      console.log('[ReviewPage] Saving prompts to tracked_prompts table...')
      const promptsToInsert = prompts.map((prompt) => ({
        business_id: business.id,
        prompt_text: prompt,
        is_active: true,
      }))

      const { error: promptsError } = await supabase
        .from('tracked_prompts')
        .insert(promptsToInsert)

      if (promptsError) {
        console.error('[ReviewPage] Error saving prompts:', promptsError)
        setError('Failed to save prompts. Please try again.')
        setSaving(false)
        return
      }

      console.log('[ReviewPage] Prompts saved successfully')

      // Create user_subscriptions record with trial status
      console.log('[ReviewPage] Creating user_subscriptions record...')
      const now = new Date()
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      const createdAt = now.toISOString()
      const updatedAt = now.toISOString()

      console.log('[ReviewPage] Trial ends at:', trialEndsAt.toISOString())
      console.log('[ReviewPage] User ID:', user.id)

      // Check if subscription already exists
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let subscriptionCreated = false

      if (existingSubscription) {
        // Update existing subscription
        console.log('[ReviewPage] Updating existing subscription')
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            subscription_status: 'trial',
            trial_ends_at: trialEndsAt.toISOString(),
            updated_at: updatedAt,
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('[ReviewPage] Error updating subscription:', updateError)
          setError('Failed to update subscription. Please try again.')
          setSaving(false)
          return
        }
        subscriptionCreated = true
        console.log('[ReviewPage] Subscription updated successfully')
      } else {
        // Create new subscription
        console.log('[ReviewPage] Creating new subscription')
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            subscription_status: 'trial',
            trial_ends_at: trialEndsAt.toISOString(),
            created_at: createdAt,
            updated_at: updatedAt,
          })

        if (subscriptionError) {
          console.error('[ReviewPage] Error creating subscription:', subscriptionError)
          setError('Failed to create subscription. Please try again.')
          setSaving(false)
          return
        }
        subscriptionCreated = true
        console.log('[ReviewPage] Subscription created successfully')
      }

      if (!subscriptionCreated) {
        console.error('[ReviewPage] Subscription was not created or updated')
        setError('Failed to set up subscription. Please try again.')
        setSaving(false)
        return
      }

      // Set business.next_check_date to 24 hours from now
      console.log('[ReviewPage] Updating business next_check_date...')
      const nextCheckDate = new Date()
      nextCheckDate.setHours(nextCheckDate.getHours() + 24)

      const { error: updateBusinessError } = await supabase
        .from('businesses')
        .update({
          next_check_date: nextCheckDate.toISOString(),
        })
        .eq('id', business.id)

      if (updateBusinessError) {
        console.error('[ReviewPage] Error updating business:', updateBusinessError)
        setError('Failed to update business settings. Please try again.')
        setSaving(false)
        return
      }

      console.log('[ReviewPage] All steps completed successfully. Refreshing and redirecting to dashboard...')
      // Refresh router to ensure fresh data is loaded
      router.refresh()
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-600">Generating your tracking prompts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !business) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
        <div className="mt-4">
          <a
            href="/dashboard/setup"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go back to setup
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Review Your Tracking Prompts</h1>
      <p className="text-gray-600 mb-8">
        We've generated 10 conversational prompts based on your business information.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Your Business: {business?.business_name}
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Industry:</span> {business?.industry}</p>
          <p><span className="font-medium">Location:</span> {business?.location}</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Generated Prompts</h2>
        <ol className="space-y-4">
          {prompts.map((prompt, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </span>
              <p className="flex-1 text-gray-900 pt-1">{prompt}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <p className="text-blue-900">
          <span className="font-semibold">📊 Weekly Tracking:</span> We'll track these 10 searches weekly across ChatGPT and Perplexity to monitor when your business appears in AI recommendations.
        </p>
      </div>

      <button
        onClick={handleStartTracking}
        disabled={saving || prompts.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Starting tracking...
          </span>
        ) : (
          'Looks Good - Start Tracking'
        )}
      </button>
    </div>
  )
}
