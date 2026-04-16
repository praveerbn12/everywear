'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SellerBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => { getBookings() }, [])

  const getBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
  
    const { data } = await supabase
      .from('bookings')
      .select('*, listings(title, image_url, price_per_day), users!bookings_buyer_id_fkey(full_name, email, id)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
  
    // Get avg rating for each buyer
    const bookingsWithRatings = await Promise.all((data || []).map(async (booking) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', booking.users?.id)
  
      const avg = reviews?.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null
  
      return { ...booking, buyerRating: avg, buyerReviewCount: reviews?.length || 0 }
    }))
  
    setBookings(bookingsWithRatings)
    setLoading(false)
  }

  const handleAccept = async (booking) => {
    // Check buyer has enough credits
    const { data: buyer } = await supabase
      .from('users').select('credits').eq('id', booking.buyer_id).single()

    if (buyer.credits < booking.total_credits) {
      alert('Buyer does not have enough credits!')
      return
    }

    // Deduct credits from buyer
    await supabase.from('users')
      .update({ credits: buyer.credits - booking.total_credits })
      .eq('id', booking.buyer_id)

    // Update booking status
    await supabase.from('bookings')
      .update({ status: 'accepted' })
      .eq('id', booking.id)

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: booking.buyer_id,
      amount: -booking.total_credits,
      type: 'booking_payment',
      description: `Payment for: ${booking.listings?.title}`,
      booking_id: booking.id
    })

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id: booking.buyer_id,
      message: `✅ Your booking for "${booking.listings?.title}" was accepted! ${booking.total_credits} credits deducted. Coordinate with seller for pickup!`
    })

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: booking.seller_id,
      message: `✅ You accepted the booking for "${booking.listings?.title}". Coordinate with buyer for meetup!`
    })

    getBookings()
  }

  const handleReject = async (booking) => {
    await supabase.from('bookings')
      .update({ status: 'rejected' })
      .eq('id', booking.id)

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id: booking.buyer_id,
      message: `❌ Your booking request for "${booking.listings?.title}" was rejected by the seller.`
    })

    getBookings()
  }

  const confirmPickupSeller = async (booking) => {
    await supabase.from('bookings')
      .update({ status: 'active' })
      .eq('id', booking.id)

    // Pay seller 90%
    const sellerPay = Math.floor(booking.total_credits * 0.9)
    const { data: seller } = await supabase
      .from('users').select('credits').eq('id', booking.seller_id).single()

    await supabase.from('users')
      .update({ credits: seller.credits + sellerPay })
      .eq('id', booking.seller_id)

    await supabase.from('transactions').insert({
      user_id: booking.seller_id,
      amount: sellerPay,
      type: 'rental_income',
      description: `Rental income: ${booking.listings?.title}`,
      booking_id: booking.id
    })

    await supabase.from('notifications').insert({
      user_id: booking.buyer_id,
      message: `📦 Pickup confirmed for "${booking.listings?.title}"! Enjoy your rental!`
    })

    getBookings()
  }

  const statusColor = (status) => {
    if (status === 'accepted') return 'bg-blue-100 text-blue-700'
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'completed') return 'bg-gray-100 text-gray-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
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

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Booking Requests</h2>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No booking requests yet</p>
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
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
  Buyer: {booking.users?.full_name} ({booking.users?.email})
  {booking.buyerRating && (
    <span className="ml-2 text-yellow-500 font-medium">
      ⭐ {booking.buyerRating} ({booking.buyerReviewCount})
    </span>
  )}
</p>
                    <p className="text-sm mt-1">📅 {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}</p>
                    <p className="text-sm font-medium mt-1">💰 {booking.total_credits} credits</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => handleAccept(booking)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition">
                        ✅ Accept
                      </button>
                      <button onClick={() => handleReject(booking)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">
                        ❌ Reject
                      </button>
                    </>
                  )}
                  {booking.status === 'accepted' && (
                    <button onClick={() => confirmPickupSeller(booking)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                      🤝 Confirm Pickup & Release Payment
                    </button>
                  )}
                  {booking.status === 'active' && (
                    <p className="text-green-600 text-sm font-medium">✅ Item is out for rental</p>
                  )}
{booking.status === 'completed' && (
  <div className="flex gap-3 items-center">
    <p className="text-gray-500 text-sm">🎉 Rental completed</p>
    <Link href={`/review/${booking.id}`}
      className="bg-yellow-400 text-black px-4 py-1 rounded-lg text-sm font-medium hover:bg-yellow-500 transition">
      ⭐ Leave Review
    </Link>
  </div>
)}
                  {booking.status === 'rejected' && (
                    <p className="text-red-500 text-sm">❌ You rejected this booking</p>
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