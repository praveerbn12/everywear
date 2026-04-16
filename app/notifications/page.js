'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Notifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getNotifications() }, [])

  const getNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setNotifications(data || [])

    // Mark all as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setLoading(false)
  }

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('notifications').delete().eq('user_id', user.id)
    setNotifications([])
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">👗 EveryWear</Link>
        <Link href="/home" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🔔 Notifications</h2>
          {notifications.length > 0 && (
            <button onClick={clearAll}
              className="text-sm text-red-500 hover:underline">
              Clear all
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🔕</p>
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id}
                className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${n.is_read ? 'border-gray-200' : 'border-black'}`}>
                <div className="flex justify-between items-start gap-3">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}