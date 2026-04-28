// src/routes/login.tsx
import { fetchUserSession } from '#/server/user'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import React, { useState } from 'react'
import { signinOTPApi, verifyOTPApi } from './server'

export const Route = createFileRoute('/login/')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [status, setStatus] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Sending verification code...')
    const { error } = await signinOTPApi({ data: { email } })
    if (error) {
      setStatus(`Error: ${error}`)
    } else {
      setStatus('Check your email for the 6-digit code!')
      setStep('otp')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Verifying code...')

    const { isSessionCreated, error } = await verifyOTPApi({ data: { email, otp } })

    if (error) {
      setStatus(`Error: ${error}`)
      return
    }

    if (!isSessionCreated) {
      setStatus('Error: No session created')
      return
    }

    setStatus('Successfully logged in! Redirecting...')

    await router.invalidate()

    // After invalidation, the auth context should be updated
    // But we might need to wait for the next tick or just use the updated state
    const auth = await fetchUserSession()
    const role = auth.role

    if (role === 'admin') {
      router.navigate({ to: '/admin' })
    } else if (role === 'vendor') {
      router.navigate({ to: '/vendors' })
    } else {
      setStatus('Error: No role assigned to user')
    }
  }

  const handleResendOtp = async () => {
    setStatus('Resending code...')

    const { error } = await signinOTPApi({ data: { email } })

    if (error) {
      setStatus(`Error: ${error}`)
    } else {
      setStatus('New code sent! Check your email.')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/assets/sgh-logo.png"
            alt="Shuwaikhgate Holding"
            className="h-16 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Procurement Portal
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Sign in to access the platform
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Send Verification Code
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <p className="text-xs text-gray-500 mb-2">Code sent to {email}</p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <button
                  type="submit"
                  className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Verify Code
                </button>
              </form>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="flex-1 py-2 px-4 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setStatus('')
                }}
                className="flex-1 py-2 px-4 text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                Change Email
              </button>
            </div>
          </div>
        )}
        {status && (
          <p className="mt-4 text-sm text-center text-gray-600 bg-gray-50 p-3 rounded-lg">
            {status}
          </p>
        )}
        <p className="mt-4 text-xs text-center text-gray-500">
          Admin access is automatically granted for authorized emails
        </p>
      </div>
    </div>
  )
}






