'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Eye, EyeOff, LogIn } from 'lucide-react'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function LoginPage() {
  const router   = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Invalid username or password')
        return
      }

      // Store token in cookie (expires in 1 day)
      Cookies.set('auth_token', data.access_token, { expires: 1, secure: true })
      Cookies.set('username',   data.username,      { expires: 1 })

        // Force hard redirect instead of soft navigation
       window.location.href = '/'

    } catch (err) {
      setError('Cannot connect to server. Make sure FastAPI is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl mb-4">
            <Leaf size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Oil Palm IoT System</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to access the dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={18} /> Sign In</>
              }
            </button>

          </form>

          {/* Default credentials hint */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-600 text-center">
              Default: admin / fyp2024
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          FYP Oil Palm IoT System — project2030.me
        </p>
      </div>
    </div>
  )
}