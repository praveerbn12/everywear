'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReviewPage({ params: paramsPromise }) {
  const params = React.use(paramsPromise)
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => { getData() }, [])

  const getData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, listings(title, image_url), buyer:users!bookings_buyer_id_fkey(full_name), seller:users!bookings_seller_id_fkey(full_name)')
      .eq('id', params.bookingId)
      .single()

    setBooking(booking)

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', params.bookingId)
      .eq('reviewer_id', user.id)

    if (existing && existing.length > 0) setAlreadyReviewed(true)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating!'); return }
    setSubmitting(true)

    const isBuyer = user.id === booking.buyer_id
    const reviewedId = isBuyer ? booking.seller_id : booking.buyer_id

    const { error: reviewError } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      rating,
      comment,
      type: isBuyer ? 'buyer_to_seller' : 'seller_to_buyer'
    })

    if (reviewError) { setError(reviewError.message); setSubmitting(false); return }

    await supabase.from('notifications').insert({
      user_id: reviewedId,
      message: `⭐ You received a ${rating}-star review for "${booking.listings?.title}"!`
    })

    setSuccess('Review submitted! Thank you 🎉')
    setSubmitting(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Booking not found</p>
    </div>
  )

  if (booking.status !== 'completed') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">⏳</p>
        <p className="text-gray-500">Reviews are only available after rental is completed</p>
        <Link href="/dashboard" className="text-black underline mt-2 block">Go to Dashboard</Link>
      </div>
    </div>
  )

  const isBuyer = user?.id === booking?.buyer_id
  const reviewingWho = isBuyer ? booking?.seller?.full_name : booking?.buyer?.full_name

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">👗 EveryWear</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </nav>

      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Item info */}
          <div className="flex gap-3 items-center mb-6 pb-4 border-b">
            {booking.listings?.image_url ? (
              <img src={booking.listings.image_url} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">👗</div>
            )}
            <div>
              <h3 className="font-bold">{booking.listings?.title}</h3>
              <p className="text-gray-500 text-sm">Rental completed ✅</p>
            </div>
          </div>

          {alreadyReviewed ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-bold">Already reviewed!</p>
              <p className="text-gray-500 text-sm mt-1">You've already submitted a review for this rental</p>
              <Link href="/dashboard" className="mt-4 block bg-black text-white py-2 px-6 rounded-lg text-sm hover:bg-gray-800 transition">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1">Rate your experience</h2>
              <p className="text-gray-500 text-sm mb-6">Reviewing: <span className="font-medium text-black">{reviewingWho}</span></p>

              {error && <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</p>}
              {success && <p className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</p>}

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="text-4xl transition-transform hover:scale-110">
                      {star <= (hover || rating) ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent!'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Share your experience..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  value={comment}
                  onChange={e => setComment(e.target.value)} />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Review ⭐'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}