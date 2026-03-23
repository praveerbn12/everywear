'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getBookings()
  }, [])

  const getBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data } = await supabase
      .from('bookings')
      .select('*, listings(title, image_url, price_per_day), users!bookings_seller_id_fkey(full_name)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    setBookings(data || [])
    setLoading(false)
  }

  const confirmPickup = async (booking) => {
    // Buyer confirms pickup success
    await supabase.from('bookings').update({ status: 'active' }).eq('id', booking.id)

    // Pay seller 90% of credits
    const sellerPay = Math.floor(booking.total_credits * 0.9)
    const appFee = booking.total_credits - sellerPay

    // Get seller current credits
    const { data: seller } = await supabase
      .from('users').select('credits').eq('id', booking.seller_id).single()

    await supabase.from('users')
      .update({ credits: seller.credits + sellerPay })
      .eq('id', booking.seller_id)

    // Log transactions
    await supabase.from('transactions').insert({
      user_id: booking.seller_id,
      amount: sellerPay,
      type: 'rental_income',
      description: `Payment for: ${booking.listings?.title}`,
      booking_id: booking.id
    })

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: booking.seller_id,
      message: `💰 You received ${sellerPay} credits for "${booking.listings?.title}"!`
    })

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id: booking.buyer_id,
      message: `✅ Pickup confirmed for "${booking.listings?.title}"! Enjoy your rental!`
    })

    getBookings()
  }

  const confirmReturn = async (booking) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)

    await supabase.from('notifications').insert({
      user_id: booking.seller_id,
      message: `📦 "${booking.listings?.title}" has been returned!`
    })

    getBookings()
  }
  const statusColor = (status) => {
    if (status === 'accepted') return 'bg-green-100 text-green-700'
    if (status === 'active') return 'bg-blue-100 text-blue-700'
    if (status === 'completed') return 'bg-gray-100 text-gray-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }
  const statusLabel = (status) => {
    if (status === 'accepted') return '✅ Accepted by Seller'
    if (status === 'active') return '🔵 Active - Item with you'
    if (status === 'completed') return '✅ Completed'
    if (status === 'rejected') return '❌ Rejected'
    if (status === 'cancelled') return '❌ Cancelled'
    return '⏳ Pending - Waiting for seller'
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
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">My Bookings</h2>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500 mb-4">No bookings yet</p>
            <Link href="/marketplace" className="bg-black text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-4 items-start">
                  {booking.listings?.image_url ? (
                    <img src={booking.listings.image_url} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">👗</div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{booking.listings?.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">Seller: {booking.users?.full_name}</p>
                    <p className="text-sm mt-1">
                      📅 {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium mt-1">💰 {booking.total_credits} credits</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  {booking.status === 'accepted' && (
                    <button
                      onClick={() => confirmPickup(booking)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                      ✅ Confirm Pickup
                    </button>
                  )}
                  {booking.status === 'active' && (
                    <button
                      onClick={() => confirmReturn(booking)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition">
                      📦 Confirm Return
                    </button>
                  )}
{booking.status === 'completed' && (
  <div className="flex gap-3 items-center">
    <p className="text-green-600 text-sm font-medium">🎉 Rental completed!</p>
    <Link href={`/review/${booking.id}`}
      className="bg-yellow-400 text-black px-4 py-1 rounded-lg text-sm font-medium hover:bg-yellow-500 transition">
      ⭐ Leave Review
    </Link>
  </div>
)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}