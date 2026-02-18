'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(153,27,27,0.2) 0%, transparent 70%)' }} />
        <div className="relative border border-white/10 rounded-2xl p-8" style={{ background: '#111111' }}>
          <h1 className="text-white font-bold text-xl mb-6 text-center">AEOLab</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-white/60 text-sm mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md outline-none transition-colors placeholder:text-white/30"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white/60 text-sm mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md outline-none transition-colors placeholder:text-white/30"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full py-2 rounded-full bg-[#991B1B] hover:bg-[#7f1d1d] text-white"
              disabled={loading}
            >
              {loading ? (
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link href="/signup" className="text-red-400 hover:text-red-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
