'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
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
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [remainingRuns, setRemainingRuns] = useState<number | null>(null)

  const supabase = createClient()

  const fetchLimitStatus = async () => {
    try {
      const response = await fetch('/api/tracking/check-limit')
      const data = await response.json()
      if (response.ok && typeof data.remainingRuns === 'number') {
        setRemainingRuns(data.remainingRuns)
      }
    } catch (err) {
      console.error('Error fetching rate limit:', err)
    }
  }

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

        // Get active prompts for this business
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

        // Fetch tracking results for these prompts
        const { data: trackingResults, error: resultsError } = await supabase
          .from('tracking_results')
          .select('*')
          .in('prompt_id', promptIds)
          .order('tracked_at', { ascending: false })
          .limit(20)

        if (resultsError) {
          console.error('Error fetching tracking results:', resultsError)
          setLoading(false)
          return
        }

        console.log('DEBUG - Tracking results:', trackingResults?.map(r => ({
          appeared: r.appeared,
          status: r.status,
          position: r.position,
          platform: r.ai_platform
        })))

        // Transform results to include prompt_text
        const resultsWithPrompts = (trackingResults || []).map((result: any) => ({
          ...result,
          prompt_text: promptMap.get(result.prompt_id) || 'Unknown prompt',
        }))

        setResults(resultsWithPrompts)

        // Calculate visibility score (exclude failed checks)
        const successfulChecks = (trackingResults || []).filter((r: any) => r.status === 'success')
        const appeared = successfulChecks.filter((r: any) => r.appeared === true)
        const failed = (trackingResults || []).filter((r: any) => r.status === 'failed')

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

  useEffect(() => {
    if (business) {
      fetchLimitStatus()
    }
  }, [business])

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
    setToast({ message: 'Prompt copied to clipboard', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRunTracking = async () => {
    if (!business) return

    setTrackingLoading(true)
    try {
      const response = await fetch('/api/tracking/run-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId: business.id }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setToast({
          message: data.error || 'Rate limit exceeded. Try again later.',
          type: 'error',
        })
        fetchLimitStatus()
      } else if (data.success) {
        setToast({
          message: data.message || 'Tracking completed successfully',
          type: 'success',
        })
        if (typeof data.remainingRuns === 'number') {
          setRemainingRuns(data.remainingRuns)
        }
        // Reload dashboard data
        window.location.reload()
      } else {
        setToast({
          message: data.error || 'Tracking failed',
          type: 'error',
        })
        fetchLimitStatus()
      }
    } catch (error) {
      console.error('Error running tracking:', error)
      setToast({
        message: 'Failed to run tracking. Please try again.',
        type: 'error',
      })
      fetchLimitStatus()
    } finally {
      setTrackingLoading(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

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
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Searches Tracked</div>
            <div className="text-2xl font-bold">{results.length}</div>
            <div className="text-xs text-gray-500 mt-1">Across ChatGPT & Perplexity</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 shadow-md rounded-xl hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-red-900 mb-1">Visibility Rate</div>
            <div className="text-3xl font-bold text-red-900">{visibilityScore}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {visibilityScore < 20 ? '🔴 Needs improvement' : visibilityScore < 50 ? '🟡 Below average' : '🟢 Good visibility'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-2xl font-bold">{appearedCount} / {totalChecks}</div>
            <div className="text-xs text-gray-500 mt-1">Successful checks</div>
          </CardContent>
        </Card>
      </div>

      {/* Run Tracking Now */}
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <Button
            size="lg"
            disabled={trackingLoading || !business || remainingRuns === 0}
            onClick={handleRunTracking}
            className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-800 text-white font-semibold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-full"
          >
            {trackingLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Running...
              </>
            ) : (
              'Run Tracking Now'
            )}
          </Button>
          {remainingRuns !== null && (
            <p
              className={`mt-2 text-sm ${
                remainingRuns === 0
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}
            >
              {remainingRuns > 0
                ? `${remainingRuns} manual run${remainingRuns !== 1 ? 's' : ''} remaining today`
                : 'Manual tracking limit reached. Automated tracking continues.'}
            </p>
          )}
        </div>
      </div>

      {/* Recent Tracking Results */}
      <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-2xl font-bold">Recent Searches</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
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
              <Card
                key={result.id}
                className="mb-4 last:mb-0 bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer rounded-lg"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-gray-900 text-base font-semibold mb-3">
                        {truncateText(result.prompt_text || 'Unknown prompt', 100)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={result.ai_platform === 'chatgpt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                        >
                          {result.ai_platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'}
                        </Badge>
                        {result.status === 'failed' ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                            ⚠ Check failed
                          </Badge>
                        ) : result.appeared === true ? (
                          <Badge className="bg-green-600 text-white hover:bg-green-600">
                            ✓ Appeared{result.position ? ` - ${result.position} position` : ''}
                          </Badge>
                        ) : result.appeared === false ? (
                          <Badge variant="destructive">
                            ✗ Not mentioned
                          </Badge>
                        ) : null}
                        <span className="text-sm text-gray-500">{formatDate(result.tracked_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {result.full_response_text && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Full Response</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Full AI Response</DialogTitle>
                              <DialogDescription>
                                Platform: {result.ai_platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'} • Checked: {new Date(result.tracked_at).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-1">Prompt:</h4>
                                <p className="text-sm text-gray-600">{result.prompt_text}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1">Full Response:</h4>
                                <p className="text-sm whitespace-pre-wrap">{result.full_response_text}</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="ghost" onClick={() => copyPrompt(result.prompt_text!)}>
                                Copy Prompt
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPrompt(result.prompt_text!)}
                      >
                        Copy Prompt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Bottom Section - Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">How to Improve Your Visibility</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '✓' : '✕'}</span>
          <p className="font-medium">{toast.message}</p>
        </div>
      )}
    </div>
  )
}
