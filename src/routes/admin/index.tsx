import { Badge, Button } from '@mantine/core'
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import React from 'react'
import BaseNavbar from '../../components/BaseNavbar'
import CustomButton from '../../components/CustomButton'
import {
  fetchAdminDashboardData,
  publishRfpAction,
  updateRfpStatus,
} from '../../server/admin'
import { logoutUser } from './server'

export const Route = createFileRoute('/admin/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' })
    }
    if (context.auth.role !== 'admin') {
      throw redirect({ to: '/vendors' })
    }
  },
  loader: async () => {
    return await fetchAdminDashboardData()
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { rfps, stats } = Route.useLoaderData()
  const router = useRouter()
  const navigate = Route.useNavigate()

  const handleLogout = async () => {
    await logoutUser()
    await router.invalidate()
    router.navigate({ to: '/login' })
  }

  const publishRfp = async (rfpId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await publishRfpAction({ data: { rfpId } })
      await router.invalidate()
    } catch (error) {
      console.error('Error publishing RFP:', error)
    }
  }

  const closeRfp = async (rfpId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateRfpStatus({ data: { rfpId, status: 'closed' } })
      await router.invalidate()
    } catch (error) {
      console.error('Error closing RFP:', error)
    }
  }

  const unpublishRfp = async (rfpId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateRfpStatus({ data: { rfpId, status: 'draft' } })
      await router.invalidate()
    } catch (error) {
      console.error('Error unpublishing RFP:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <BaseNavbar
        title="Admin Portal"
        actionButton={
          <div className="flex gap-4">
            <CustomButton
              buttonType="primary"
              onClick={() => navigate({ to: '/admin/rfp/create' })}
            >
              Create RFP
            </CustomButton>
            <CustomButton
              buttonType="secondary"
              onClick={() => navigate({ to: '/admin/vendors' })}
            >
              Vendors
            </CustomButton>
            <CustomButton
              buttonType="secondary"
              onClick={() => navigate({ to: '/admin/categories' })}
            >
              Categories
            </CustomButton>
            <CustomButton buttonType="secondary" onClick={handleLogout}>
              Logout
            </CustomButton>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total RFPs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total_rfps}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active RFPs</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {stats.active_rfps}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Vendors</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total_vendors}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">All RFPs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {rfps.map((rfp) => (
              <div
                key={rfp.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  router.navigate({
                    to: '/admin/rfp/$id',
                    params: { id: rfp.id },
                  })
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {rfp.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Opens:{' '}
                      {new Date(rfp.starts_at).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Kuwait',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      | Closes:{' '}
                      {new Date(rfp.ends_at).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Kuwait',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {rfp.status === 'draft' && (
                      <Button
                        color="green"
                        size="xs"
                        onClick={(e) => publishRfp(rfp.id, e)}
                      >
                        Publish
                      </Button>
                    )}
                    {rfp.status === 'open' && (
                      <>
                        <Button
                          color={'yellow.9'}
                          onClick={(e) => unpublishRfp(rfp.id, e)}
                          size="compact-xs"
                        >
                          Unpublish
                        </Button>
                        <Button
                          color={'red.9'}
                          onClick={(e) => closeRfp(rfp.id, e)}
                          size="compact-xs"
                        >
                          Close
                        </Button>
                      </>
                    )}
                    <Badge
                      color={
                        rfp.status === 'open'
                          ? 'green'
                          : rfp.status === 'draft'
                            ? 'yellow'
                            : 'gray'
                      }
                      radius="xl"
                      size="xs"
                    >
                      {rfp.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {rfps.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No RFPs yet. Create your first RFP to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
