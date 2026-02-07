import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="lg:ml-64">
        <TrialBanner />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
