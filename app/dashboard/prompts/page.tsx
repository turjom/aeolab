'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PromptWithStats {
  id: string
  prompt_text: string
  is_active: boolean
  created_at: string
  total_checks: number
  appeared_count: number
  last_tracked_at: string | null
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not yet tracked'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function TrackedPromptsPage() {
  const [prompts, setPrompts] = useState<PromptWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPrompts()
  }, [])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function loadPrompts() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setLoading(false)
        return
      }

      // Get business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (businessError || !business) {
        setLoading(false)
        return
      }

      // Get all tracked prompts for this business
      const { data: trackedPrompts, error: promptsError } = await supabase
        .from('tracked_prompts')
        .select('id, prompt_text, is_active, created_at')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true })

      if (promptsError || !trackedPrompts) {
        setLoading(false)
        return
      }

      // For each prompt, get tracking stats
      const promptsWithStats: PromptWithStats[] = await Promise.all(
        trackedPrompts.map(async (prompt) => {
          // Get tracking results for this prompt
          const { data: results, error: resultsError } = await supabase
            .from('tracking_results')
            .select('appeared, tracked_at')
            .eq('prompt_id', prompt.id)
            .order('tracked_at', { ascending: false })

          const totalChecks = results?.length || 0
          const appearedCount = results?.filter(r => r.appeared === true).length || 0
          const lastTracked = results && results.length > 0 ? results[0].tracked_at : null

          return {
            id: prompt.id,
            prompt_text: prompt.prompt_text,
            is_active: prompt.is_active,
            created_at: prompt.created_at,
            total_checks: totalChecks,
            appeared_count: appearedCount,
            last_tracked_at: lastTracked,
          }
        })
      )

      setPrompts(promptsWithStats)
      setLoading(false)
    } catch (err) {
      console.error('Error loading prompts:', err)
      setLoading(false)
    }
  }

  const handleToggleActive = async (promptId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus

      const { error } = await supabase
        .from('tracked_prompts')
        .update({ is_active: newStatus })
        .eq('id', promptId)

      if (error) {
        setToast({
          message: 'Failed to update prompt status',
          type: 'error',
        })
        return
      }

      // Update local state
      setPrompts(prev =>
        prev.map(p => (p.id === promptId ? { ...p, is_active: newStatus } : p))
      )

      setToast({
        message: newStatus ? 'Prompt activated' : 'Prompt paused',
        type: 'success',
      })
    } catch (err) {
      console.error('Error toggling prompt:', err)
      setToast({
        message: 'Failed to update prompt status',
        type: 'error',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#0a0a0a]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-red-400 mx-auto mb-4"
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
          <p className="text-white/60">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-[#0a0a0a] min-h-screen">
      <div className="border border-white/10 rounded-2xl p-6 mb-6" style={{ background: '#111111' }}>
        <h1 className="text-white text-2xl font-bold mb-2">Tracked Prompts</h1>
        <p className="text-white/60 text-sm">Manage the search queries we track for your business</p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-900/30 border border-green-400/20 text-green-400'
              : 'bg-red-900/30 border border-red-400/20 text-red-400'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '✓' : '✕'}</span>
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      {/* Prompts List */}
      {prompts.length === 0 ? (
        <div className="border border-white/10 rounded-2xl p-6" style={{ background: '#111111' }}>
          <p className="text-white/60 text-center">No prompts found. Please complete business setup.</p>
        </div>
      ) : (
        <div>
          {prompts.map((prompt) => (
            <div key={prompt.id} className="border border-white/10 rounded-xl p-4 mb-3" style={{ background: '#1a1a1a' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm mb-2">{prompt.prompt_text}</p>
                  <p className="text-white/40 text-xs">
                    Appeared {prompt.appeared_count} out of {prompt.total_checks} checks
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    Last checked: {formatDate(prompt.last_tracked_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {prompt.is_active ? (
                    <span className="bg-green-900/30 text-green-400 border border-green-400/20 rounded-full px-2 py-0.5 text-xs">Active</span>
                  ) : (
                    <span className="bg-white/5 text-white/30 border border-white/10 rounded-full px-2 py-0.5 text-xs">Paused</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(prompt.id, prompt.is_active)}
                    aria-label={prompt.is_active ? 'Active' : 'Paused'}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                    style={{
                      background: prompt.is_active ? '#166534' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      style={{ transform: prompt.is_active ? 'translateX(24px)' : 'translateX(4px)' }}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
