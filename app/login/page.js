'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) { setError(error.message); setLoading(false); return }

    router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--background)'}}>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-center mb-1" style={{color: 'var(--foreground)'}}>
          👗 EveryWear
        </h1>
        <p className="text-center text-sm mb-8" style={{color: 'var(--accent)'}}>
          Your campus clothing rental marketplace
        </p>

        <p className="text-center font-medium mb-6" style={{color: 'var(--foreground)'}}>
          Welcome back!
        </p>

        {error && (
          <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{color: 'var(--foreground)'}}>
              Email
            </label>
            <input
              type="email" required
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 text-sm"
              style={{'--tw-ring-color': 'var(--accent)'}}
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{color: 'var(--foreground)'}}>
              Password
            </label>
            <input
              type="password" required
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 text-sm"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-medium transition disabled:opacity-50 text-white"
            style={{background: 'var(--primary)'}}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{color: 'var(--foreground)'}}>
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{color: 'var(--accent)'}}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}