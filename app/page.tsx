import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-200 text-red-900">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-red-900">
              AEOLab
            </Link>
            <Button variant="ghost" className="text-red-900 hover:text-red-800" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-red-900">
          Track Your AI Visibility
        </h1>
        <p className="text-xl sm:text-2xl text-red-900 mb-10 max-w-2xl mx-auto">
          Know when ChatGPT and Perplexity recommend your business
        </p>
        <div className="flex flex-col items-center gap-4">
          <Button size="lg" className="text-lg" asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <p className="text-sm text-red-900/70">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Feature 1 */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-red-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-red-900">Direct AI Tracking</h3>
              <p className="text-gray-600">Weekly checks across ChatGPT & Perplexity</p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-red-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-red-900">Built for Small Business</h3>
              <p className="text-gray-600">$39/month, simple setup</p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-red-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-red-900">Actionable Insights</h3>
              <p className="text-gray-600">Get recommendations to improve</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
