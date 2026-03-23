'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Admin() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) { router.push('/dashboard'); return }

    getListings()
  }

  const getListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, users(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setListings(data || [])
    setLoading(false)
  }

  const handleAction = async (listing, action) => {
    await supabase
      .from('listings')
      .update({ status: action })
      .eq('id', listing.id)

    await supabase.from('notifications').insert({
      user_id: listing.seller_id,
      message: action === 'approved'
        ? `✅ Your listing "${listing.title}" has been approved and is now live!`
        : `❌ Your listing "${listing.title}" was rejected. Please review and resubmit.`
    })

    setListings(listings.filter(l => l.id !== listing.id))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">👗 EveryWear</Link>
        <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">Admin Panel</span>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Pending Listings</h2>
        <p className="text-gray-500 mb-6">Review and approve or reject seller listings</p>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-500">No pending listings!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-4 items-start">
                  {listing.image_url ? (
                    <img src={listing.image_url} className="w-24 h-24 rounded-xl object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">👗</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{listing.title}</h3>
                    <p className="text-gray-500 text-sm mb-1">{listing.description}</p>
                    <p className="text-sm">Size: <span className="font-medium">{listing.size}</span> • Color: <span className="font-medium">{listing.color}</span></p>
                    <p className="text-sm">Price: <span className="font-medium">{listing.price_per_day} credits/day</span></p>
                    <p className="text-sm text-gray-400 mt-1">By: {listing.users?.full_name} ({listing.users?.email})</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAction(listing, 'approved')}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition">
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleAction(listing, 'rejected')}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition">
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}