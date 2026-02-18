import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-white">
              AEOLab
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-white hover:text-white/80 transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-white rounded-full px-5 py-2 font-medium transition-colors bg-[#991B1B] hover:bg-[#7f1d1d]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-16"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(153,27,27,0.5) 0%, transparent 60%), #0a0a0a' }}
      >
        {/* Radial Glow Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[800px] h-[800px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #991B1B 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Beta Badge */}
          <span className="inline-flex items-center border border-white/20 rounded-full px-3 py-1 text-sm text-white/60">
            Now in Beta — Free for 14 days
          </span>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-tight mt-4 max-w-2xl mx-auto">
            Know When AI Recommends Your Business
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/60 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            ChatGPT and Perplexity are sending customers to your competitors. AEOLab tracks every AI recommendation so you know exactly where you stand — and what to fix.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/signup"
              className="text-white rounded-full px-8 py-3 text-base font-medium transition-colors bg-[#991B1B] hover:bg-[#7f1d1d]"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/login"
              className="border border-white/20 hover:border-white/40 text-white rounded-full px-8 py-3 text-base transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Below buttons text */}
          <p className="text-white/40 text-sm mt-4">
            No credit card required · Cancel anytime
          </p>

          {/* Mock Dashboard UI */}
          <div className="mt-16 w-full max-w-4xl mx-auto rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#111111' }}>
            {/* Top bar */}
            <div className="flex items-center px-4 py-3 gap-2" style={{ background: '#1a1a1a' }}>
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 flex justify-center">
                <div className="rounded px-4 py-1 text-xs text-white/30" style={{ background: '#222' }}>
                  aeolab.vercel.app
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
                  <div className="text-white/50 text-xs">Total Searches Tracked</div>
                  <div className="text-white text-2xl font-bold mt-1">240</div>
                  <div className="text-white/30 text-xs mt-1">Across ChatGPT & Perplexity</div>
                </div>

                {/* Card 2 - Middle with red accent */}
                <div className="rounded-xl p-4 border border-red-900/50" style={{ background: '#1a1a1a' }}>
                  <div className="text-red-400 text-xs font-medium">Visibility Rate</div>
                  <div className="text-red-400 text-3xl font-bold mt-1">34%</div>
                  <div className="text-white/30 text-xs mt-1">🔴 Needs improvement</div>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
                  <div className="text-white/50 text-xs">This Week</div>
                  <div className="text-white text-2xl font-bold mt-1">7 / 20</div>
                  <div className="text-white/30 text-xs mt-1">Successful checks</div>
                </div>
              </div>

              {/* Mock result rows */}
              <div className="mt-4">
                {/* Row 1 */}
                <div className="rounded-xl p-4 mb-3 flex justify-between items-center" style={{ background: '#1a1a1a' }}>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm mb-2">
                      Who should I hire for kitchen renovation in LA?
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs border border-blue-400/20 text-blue-400" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        ChatGPT
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs border border-green-400/20 text-green-400" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        ✓ Appeared
                      </span>
                    </div>
                  </div>
                  <div className="text-white/30 text-xs">Feb 18, 2026, 2:14 PM</div>
                </div>

                {/* Row 2 */}
                <div className="rounded-xl p-4 mb-3 flex justify-between items-center" style={{ background: '#1a1a1a' }}>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm mb-2">
                      Best kitchen remodelers near me
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs border border-purple-400/20 text-purple-400" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                        Perplexity
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs border border-red-400/20 text-red-400" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        ✗ Not mentioned
                      </span>
                    </div>
                  </div>
                  <div className="text-white/30 text-xs">Feb 18, 2026, 2:14 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(153,27,27,0.45) 0%, transparent 70%), #0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-white text-3xl font-bold text-center">Everything small businesses need</h2>
          <p className="text-white/50 text-base mt-3 text-center">
            No enterprise complexity. No $300/month price tags.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Feature 1 */}
            <div className="rounded-2xl p-8 border border-white/10" style={{ background: '#111' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(153, 27, 27, 0.3)' }}>
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Direct AI Tracking</h3>
              <p className="text-sm leading-relaxed text-white/40">
                We query ChatGPT and Perplexity weekly with searches your customers actually use. You see exactly when you appear — and when you don't.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl p-8 border border-white/10" style={{ background: '#111' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(153, 27, 27, 0.3)' }}>
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Visibility Score</h3>
              <p className="text-sm leading-relaxed text-white/40">
                A simple percentage showing how often AI recommends you. Track improvement over time as you act on our suggestions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl p-8 border border-white/10" style={{ background: '#111' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(153, 27, 27, 0.3)' }}>
                <span className="text-xl">💡</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Actionable Recommendations</h3>
              <p className="text-sm leading-relaxed text-white/40">
                Not just data — specific steps to improve your AI visibility based on your industry, location, and current score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(153,27,27,0.4) 0%, transparent 70%), #111111' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-white text-3xl font-bold text-center">Simple pricing for small businesses</h2>

          <div className="max-w-sm mx-auto mt-12 rounded-2xl p-8 border border-red-900/30 text-center" style={{ background: '#1a1a1a' }}>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-white">$39</span>
              <span className="text-white/50 text-lg">/month</span>
            </div>
            <p className="text-white/60 text-sm mt-2">
              14-day free trial · No credit card required
            </p>

            <div className="mt-6 border-t border-white/10" />

            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✓</span>
                <span className="text-white/70 text-sm">Weekly AI tracking across ChatGPT & Perplexity</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✓</span>
                <span className="text-white/70 text-sm">10 tracked search prompts auto-generated for your business</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✓</span>
                <span className="text-white/70 text-sm">Actionable recommendations to improve visibility</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✓</span>
                <span className="text-white/70 text-sm">Full transparency — see every AI response</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="block mt-8 w-full text-white rounded-full py-3 font-medium transition-colors text-center bg-[#991B1B] hover:bg-[#7f1d1d]"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center" style={{ background: '#0a0a0a' }}>
        <p className="text-white/30 text-sm">
          © 2026 AEOLab · Built for small businesses
        </p>
      </footer>
    </div>
  )
}
