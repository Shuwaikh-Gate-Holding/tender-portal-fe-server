import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import BaseNavbar from '../../components/BaseNavbar'
import CustomButton from '../../components/CustomButton'
import type { Rfp } from '../../server/rfps'
import { fetchOpenRfps } from '../../server/rfps'
import { logoutAction } from '../../server/user'

export const Route = createFileRoute('/vendors/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' })
    }
    if (context.auth.role === 'admin') {
      throw redirect({ to: '/admin' })
    }
  },
  loader: async () => {
    return await fetchOpenRfps()
  },
  component: VendorDashboard,
})

function VendorDashboard() {
  const rfps = Route.useLoaderData()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAction()
    await router.invalidate()
    router.navigate({ to: '/login' })
  }

  const getRfpStatus = (rfp: Rfp) => {
    if (rfp.status === 'closed') {
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
    }

    const now = new Date()
    const start = new Date(rfp.starts_at)
    const end = new Date(rfp.ends_at)

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' }
    } else if (now >= start && now <= end) {
      return { label: 'Active Now', color: 'bg-green-100 text-green-800' }
    } else {
      return { label: 'Ended', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Vendor Portal"
        actionButton={
          <CustomButton buttonType="secondary" onClick={handleLogout}>
            Logout
          </CustomButton>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Available RFPs</h1>
          <p className="text-gray-600 mt-1">
            Browse and participate in active procurement opportunities
          </p>
        </div>

        <div className="grid gap-6">
          {rfps.map((rfp) => (
            <div
              key={rfp.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() =>
                router.navigate({
                  to: '/vendors/rfp/$id',
                  params: { id: rfp.id },
                })
              }
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {rfp.title}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRfpStatus(rfp).color}`}
                  >
                    {getRfpStatus(rfp).label}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {rfp.description}
                </p>
                <div className="flex gap-6 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Opens:</span>{' '}
                    {new Date(rfp.starts_at).toLocaleString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Closes:</span>{' '}
                    {new Date(rfp.ends_at).toLocaleString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  View Details & Submit Bid →
                </button>
              </div>
            </div>
          ))}
          {rfps.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">
                No active RFPs at the moment.
              </p>
              <p className="text-gray-400 mt-2">
                Check back later for new opportunities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
