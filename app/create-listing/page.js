'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateListing() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    size: '',
    color: '',
    price_per_day: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let image_url = null

    // Upload image if selected
    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, imageFile)

      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('listings')
        .getPublicUrl(fileName)

      image_url = urlData.publicUrl
    }

    // Create listing
    const { error: dbError } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: form.title,
      description: form.description,
      size: form.size,
      color: form.color,
      price_per_day: parseInt(form.price_per_day),
      image_url,
      status: 'pending'
    })

    if (dbError) { setError(dbError.message); setLoading(false); return }

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: user.id,
      message: `Your listing "${form.title}" has been submitted for review!`
    })

    setSuccess('Listing submitted! Waiting for admin approval.')
    setLoading(false)
    setTimeout(() => router.push('/my-listings'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">👗 EveryWear</Link>
        <Link href="/home" className="text-sm text-gray-500 hover:underline">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Listing</h2>

        {error && <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</p>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-black transition"
              onClick={() => document.getElementById('imageInput').click()}>
              {imagePreview ? (
                <img src={imagePreview} className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div>
                  <p className="text-4xl mb-2">📸</p>
                  <p className="text-gray-500 text-sm">Click to upload photo</p>
                </div>
              )}
            </div>
            <input id="imageInput" type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required placeholder="e.g. Blue Floral Dress"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} placeholder="Describe the item..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                value={form.size} onChange={e => setForm({...form, size: e.target.value})}>
                <option value="">Select size</option>
                <option>XS</option><option>S</option><option>M</option>
                <option>L</option><option>XL</option><option>XXL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input type="text" placeholder="e.g. Blue, Red"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per day (credits)</label>
            <input type="number" required min="1" placeholder="e.g. 50"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} />
            <p className="text-xs text-gray-400 mt-1">💡 Recommended: 10-20% of item value per day</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}