'use client'

import Link from 'next/link'

export default function BillingPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <div className="border border-white/10 rounded-2xl p-12 max-w-md mx-auto mt-24 text-center" style={{ background: '#111111' }}>
        <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-900/50 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-xl">⚡</span>
        </div>
        <h1 className="text-white font-bold text-2xl mb-3">Billing Coming Soon</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          You're currently on a free 14-day beta trial. Paid subscriptions will be available at $39/month once the beta ends. We'll notify you by email before your trial expires.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-400/20 bg-green-400/10 text-green-400 text-sm mb-6">
          ✓ Beta Trial Active
        </div>
        <Link href="/dashboard" className="text-white/30 hover:text-white/60 text-sm mt-6 block">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
