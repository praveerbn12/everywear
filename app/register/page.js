'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Logo = () => (
  <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
    <svg width="160" height="40" viewBox="0 0 180 48" fill="none">
      <path
        d="M24 10 C24 6 28 4 32 4 C36 4 40 6 40 10 C40 14 36 16 32 16 L32 20 L8 36 C6 37 6 40 8 40 L56 40 C58 40 58 37 56 36 L32 20"
        stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="72" y="28" fontFamily="Helvetica Neue, Arial" fontSize="20" fontWeight="800" fill="#111" letterSpacing="-0.5">EveryWear</text>
    </svg>
  </Link>
)

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // Default everyone to both renter and lender
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: form.email,
      full_name: form.full_name,
      is_buyer: true,
      is_seller: true,
      credits: 1000
    })

    if (dbError) { setError(dbError.message); setLoading(false); return }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h2 className="text-2xl font-black text-gray-900 text-center mb-1">
          Create your account
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Rent from others. List your own clothes. Do both.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text" required
              placeholder="Jane Smith"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email" required
              placeholder="you@syr.edu"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password" required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          {/* What they get */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex gap-4 text-xs text-gray-500">
            <span>✓ Browse & rent clothes</span>
            <span>✓ List your own items</span>
            <span>✓ 1,000 credits to start</span>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}