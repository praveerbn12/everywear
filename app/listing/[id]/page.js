'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ListingDetail({ params: paramsPromise }) {
  const params = React.use(paramsPromise)
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState({ start_date: '', end_date: '' })
  const [totalCost, setTotalCost] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getlisting()
  }, [])

  useEffect(() => {
    calculateCost()
  }, [booking, listing])

  const getlisting = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', user.id).single()
    setProfile(profile)

    const { data } = await supabase
      .from('listings')
      .select('*, users(full_name, email)')
      .eq('id', params.id)
      .single()

    setListing(data)
    setLoading(false)
  }

  const calculateCost = () => {
    if (!booking.start_date || !booking.end_date || !listing) return
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (days > 0) setTotalCost(days * listing.price_per_day)
    else setTotalCost(0)
  }

  const handleBooking = async () => {
    if (!booking.start_date || !booking.end_date) { setError('Please select dates'); return }
    if (totalCost <= 0) { setError('End date must be after start date'); return }

    setSubmitting(true)
    setError('')

    // Check availability — no overlapping bookings
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('listing_id', listing.id)
      .in('status', ['pending', 'accepted', 'active'])
      .lte('start_date', booking.end_date)
      .gte('end_date', booking.start_date)

    if (existing && existing.length > 0) {
      setError('❌ Sorry! This item is already booked for these dates. Please choose different dates.')
      setSubmitting(false)
      return
    }

    // Create booking request (no credit deduction yet)
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_credits: totalCost,
        status: 'pending'
      })

    if (bookingError) { setError(bookingError.message); setSubmitting(false); return }

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: listing.seller_id,
      message: `📦 New booking request for "${listing.title}" from ${profile.full_name} (${booking.start_date} → ${booking.end_date}). Please accept or reject!`
    })

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id: user.id,
      message: `⏳ Booking request sent for "${listing.title}"! Waiting for seller to accept. No credits deducted yet.`
    })

    setSuccess('Booking request sent! Waiting for seller to accept. Credits will only deduct once accepted.')
    setSubmitting(false)
    setTimeout(() => router.push('/my-bookings'), 2500)
  }
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Listing not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">👗 EveryWear</Link>
        <Link href="/marketplace" className="text-sm text-gray-500 hover:underline">← Back to Marketplace</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div>
            {listing.image_url ? (
              <img src={listing.image_url} className="w-full rounded-2xl object-cover max-h-96" />
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-2xl flex items-center justify-center text-6xl">👗</div>
            )}
          </div>

          {/* Details */}
          <div>
            <h2 className="text-3xl font-bold mb-2">{listing.title}</h2>
            <p className="text-gray-500 mb-4">{listing.description}</p>

            <div className="flex gap-2 mb-4">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Size: {listing.size}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Color: {listing.color}</span>
            </div>

            <p className="text-2xl font-bold mb-1">{listing.price_per_day} <span className="text-base font-normal text-gray-500">credits/day</span></p>
            <p className="text-sm text-gray-400 mb-6">Listed by {listing.users?.full_name}</p>

            {/* Booking Form */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-bold mb-3">📅 Select Rental Dates</h3>

              {error && <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-3 text-sm">{error}</p>}
              {success && <p className="bg-green-50 text-green-600 p-3 rounded-lg mb-3 text-sm">{success}</p>}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    value={booking.start_date}
                    onChange={e => setBooking({...booking, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date"
                    min={booking.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    value={booking.end_date}
                    onChange={e => setBooking({...booking, end_date: e.target.value})} />
                </div>

                {totalCost > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total cost</span>
                      <span className="font-bold">{totalCost} credits</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Your balance</span>
                      <span className={profile?.credits >= totalCost ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                        {profile?.credits} credits
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={submitting || totalCost <= 0}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
                  {submitting ? 'Processing...' : `Rent Now ${totalCost > 0 ? `(${totalCost} credits)` : ''}`}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  💰 Credits will be held until pickup is confirmed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}