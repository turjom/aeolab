'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TrackingResult {
  id: string
  prompt_id: string
  ai_platform: 'chatgpt' | 'perplexity'
  appeared: boolean | null
  position: number | null
  full_response_text: string | null
  status: 'success' | 'failed'
  error_message: string | null
  tracked_at: string
  prompt_text?: string
}

interface Business {
  id: string
  business_name: string
  industry: string
  location: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getRecommendations(visibilityScore: number, industry: string, location: string): string[] {
  const recommendations: string[] = []
  
  if (visibilityScore < 20) {
    // Tier 1: Poor Visibility
    recommendations.push(`Add more online reviews mentioning your service and location`)
    recommendations.push(`Create a blog post about ${industry.toLowerCase()} in ${location}`)
    recommendations.push(`Ensure your website clearly states your location and services`)
    recommendations.push(`Get listed in local business directories (Google Business, Yelp)`)
    recommendations.push(`Ask satisfied customers to mention you in online forums`)
  } else if (visibilityScore < 50) {
    // Tier 2: Below Average
    recommendations.push(`Increase your Google review count - aim for 20+ reviews`)
    recommendations.push(`Add FAQ section to your website answering common questions`)
    recommendations.push(`Create case studies or portfolio showcasing your work`)
    recommendations.push(`Engage in local community discussions online`)
  } else if (visibilityScore < 70) {
    // Tier 3: Good
    recommendations.push(`Maintain your current review momentum`)
    recommendations.push(`Expand content to cover more service variations`)
    recommendations.push(`Build backlinks from local websites and blogs`)
  } else {
    // Tier 4: Excellent
    recommendations.push(`Great visibility! Keep up your current strategy. You're appearing in most AI search results.`)
    return recommendations
  }

  // Add industry-specific tip
  const industryTips: Record<string, string> = {
    'Home Renovation/Remodeling': 'Share before/after photos on your website and social media',
    'Photography (Wedding, Event, Portrait)': 'Build a strong portfolio showcasing your unique style',
    'Real Estate Agent (US) / Property Agent (SG)': 'Create neighborhood guides and market reports',
    'HVAC Services (US) / Air Conditioning Services (SG)': 'Highlight emergency services and fast response times',
    'Plumbing Services': 'Emphasize licensing, insurance, and certifications',
    'Consulting (Business, Marketing, IT)': 'Publish thought leadership content in your niche',
    'Web Design/Development': 'Showcase client case studies with measurable results',
    'Landscaping/Lawn Care': 'Display seasonal project galleries and testimonials',
  }

  const industryTip = industryTips[industry]
  if (industryTip) {
    recommendations.push(industryTip)
  }

  return recommendations.slice(0, 5) // Return max 5 recommendations
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [results, setResults] = useState<TrackingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [visibilityScore, setVisibilityScore] = useState(0)
  const [appearedCount, setAppearedCount] = useState(0)
  const [totalChecks, setTotalChecks] = useState(0)
  const [failedChecks, setFailedChecks] = useState(0)
  const [fullResponseModal, setFullResponseModal] = useState<{ text: string; prompt: string; platform: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setLoading(false)
          return
        }

        // Fetch business
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (businessError || !businessData) {
          setLoading(false)
          return
        }

        setBusiness(businessData)

        // Fetch tracked prompts
        const { data: prompts, error: promptsError } = await supabase
          .from('tracked_prompts')
          .select('id, prompt_text')
          .eq('business_id', businessData.id)
          .eq('is_active', true)

        if (promptsError || !prompts) {
          setLoading(false)
          return
        }

        const promptIds = prompts.map(p => p.id)
        const promptMap = new Map(prompts.map(p => [p.id, p.prompt_text]))

        // Fetch tracking results
        const { data: trackingResults, error: resultsError } = await supabase
          .from('tracking_results')
          .select('*')
          .in('prompt_id', promptIds)
          .order('tracked_at', { ascending: false })
          .limit(20)

        if (resultsError || !trackingResults) {
          setLoading(false)
          return
        }

        // Add prompt text to results
        const resultsWithPrompts = trackingResults.map(result => ({
          ...result,
          prompt_text: promptMap.get(result.prompt_id) || 'Unknown prompt',
        }))

        setResults(resultsWithPrompts)

        // Calculate visibility score
        const successfulChecks = trackingResults.filter(r => r.status === 'success')
        const appeared = successfulChecks.filter(r => r.appeared === true)
        const failed = trackingResults.filter(r => r.status === 'failed')

        const score = successfulChecks.length > 0
          ? Math.round((appeared.length / successfulChecks.length) * 100)
          : 0

        setVisibilityScore(score)
        setAppearedCount(appeared.length)
        setTotalChecks(successfulChecks.length)
        setFailedChecks(failed.length)

        setLoading(false)
      } catch (err) {
        console.error('Error loading dashboard:', err)
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase])

  const getScoreColor = (score: number) => {
    if (score < 20) return 'text-red-600'
    if (score < 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score < 20) return 'bg-red-50 border-red-200'
    if (score < 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  const copyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-red-900 mx-auto mb-4"
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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No business information found. Please complete setup.</p>
        </div>
      </div>
    )
  }

  const recommendations = getRecommendations(visibilityScore, business.industry, business.location)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Top Section - Visibility Score */}
      <div className={`rounded-lg border-2 p-8 ${getScoreBgColor(visibilityScore)}`}>
        <div className="text-center">
          <h2 className="text-sm font-medium text-gray-600 mb-2">Visibility Score</h2>
          <div className={`text-6xl font-bold mb-4 ${getScoreColor(visibilityScore)}`}>
            {visibilityScore}%
          </div>
          <p className="text-gray-700 text-lg">
            You appeared in <span className="font-semibold">{appearedCount}</span> out of{' '}
            <span className="font-semibold">{totalChecks}</span> searches this week
          </p>
          {failedChecks > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {failedChecks} check{failedChecks > 1 ? 's' : ''} failed this week
            </p>
          )}
        </div>
      </div>

      {/* Middle Section - Recent Tracking Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Searches</h2>
        
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">No tracking data yet</p>
            <p className="text-gray-500">
              Your first tracking will run within 24 hours
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">{result.prompt_text}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          result.ai_platform === 'chatgpt'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {result.ai_platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'}
                      </span>
                      {result.status === 'success' ? (
                        result.appeared ? (
                          <span className="text-green-700 font-medium">
                            ✅ Appeared
                            {result.position && ` (${result.position}${result.position === 1 ? 'st' : result.position === 2 ? 'nd' : result.position === 3 ? 'rd' : 'th'} position)`}
                          </span>
                        ) : (
                          <span className="text-gray-600">❌ Not mentioned</span>
                        )
                      ) : (
                        <span className="text-yellow-700 font-medium">
                          ⚠️ Check failed
                          {result.error_message && `: ${result.error_message}`}
                        </span>
                      )}
                      <span className="text-gray-500">{formatDate(result.tracked_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    {result.full_response_text && (
                      <button
                        onClick={() =>
                          setFullResponseModal({
                            text: result.full_response_text!,
                            prompt: result.prompt_text!,
                            platform: result.ai_platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity',
                          })
                        }
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        View Full Response
                      </button>
                    )}
                    <button
                      onClick={() => copyPrompt(result.prompt_text!)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      Copy Prompt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Improve Your Visibility</h2>
        {recommendations.length > 0 ? (
          <ol className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-gray-700 pt-0.5">{rec}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-600">Keep up the great work!</p>
        )}
      </div>

      {/* Full Response Modal */}
      {fullResponseModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setFullResponseModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Full AI Response</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Platform: {fullResponseModal.platform}
                  </p>
                </div>
                <button
                  onClick={() => setFullResponseModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Prompt:</span> {fullResponseModal.prompt}
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {fullResponseModal.text}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullResponseModal.text)
                  // You could add a toast notification here
                }}
                className="px-4 py-2 bg-red-900 text-white rounded hover:bg-red-800 transition-colors"
              >
                Copy Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
