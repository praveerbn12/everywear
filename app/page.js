'use client'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.push('/home')
    }
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── HERO ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-8 py-24">
        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Syracuse University · Peer-to-Peer Clothing Rental
        </div>
        <h1 className="text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6 max-w-3xl">
          Rent, Wear &amp;<br />Return with Ease
        </h1>
        <p className="text-gray-500 text-lg max-w-lg leading-relaxed mb-10">
          Borrow clothes from students around you. List what you own and earn credits. Every rental keeps a garment out of landfill.
        </p>
        <div className="flex gap-4">
          <Link href="/marketplace"
            className="bg-black text-white font-medium px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Browse Listings
          </Link>
          <Link href="/register"
            className="bg-gray-100 text-gray-900 font-medium px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors">
            Create Account
          </Link>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="bg-black py-14 px-8">
        <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-widest mb-10">
          Why this matters — the numbers behind EveryWear
        </p>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { num: '1.4B lbs', label: 'Textile waste in NY yearly', source: 'EPA, 2023' },
            { num: '22,000+', label: 'Syracuse students on campus', source: 'SU, Fall 2022' },
            { num: '57%', label: 'CO₂ reduction per rental', source: 'Ellen MacArthur Foundation' },
            { num: '$300+', label: 'Avg student spend on event wear', source: 'ThredUp, 2023' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-white mb-2">{s.num}</p>
              <p className="text-sm text-gray-400 mb-1">{s.label}</p>
              <p className="text-xs text-gray-600">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              From browsing to returning — the full rental loop in 3 steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Browse & Book', desc: 'Find clothes you love, pick your rental dates, and send a booking request. The seller gets notified instantly and has 24 hours to respond.' },
              { num: '02', title: 'Meet & Pickup', desc: 'Coordinate a quick on-campus meetup with the seller. Pick up the item — your rental begins and credits are held securely in escrow.' },
              { num: '03', title: 'Wear & Return', desc: 'Enjoy the outfit. Return it on time and your security deposit is released straight back to your wallet. Both parties rate each other.' },
            ].map(step => (
              <div key={step.num} className="bg-gray-50 rounded-2xl p-8">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mb-5">
                  <span className="text-xs font-bold text-white">{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUSTAINABILITY CALLOUT ── */}
      <section className="border-t border-gray-100 py-16 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
              UN SDG 12 · Responsible Consumption
            </span>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Every rental is a<br />purchase not made
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The average student discards event wear after just 3–5 wears. Each EveryWear rental adds uses to an existing garment — cutting its per-wear CO₂ footprint by up to 57% compared to buying new.
            </p>
            <p className="text-gray-400 text-xs">
              At 400 rentals/month: <span className="text-gray-700 font-semibold">440 kg CO₂ avoided</span> and <span className="text-gray-700 font-semibold">236,000 litres of water saved</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: '440 kg', label: 'CO₂ avoided per month', sub: '≈ 1,750 km of driving' },
              { val: '236K L', label: 'Water saved per month', sub: '≈ 1,500 showers' },
              { val: '10%', label: 'Global carbon from fashion', sub: 'More than aviation' },
              { val: '3–5x', label: 'Avg wears before discard', sub: 'Student event wear' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-5">
                <p className="text-2xl font-black text-gray-900 mb-1">{item.val}</p>
                <p className="text-xs font-semibold text-gray-700 mb-0.5">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-gray-50 py-16 px-8 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-3">
          Your closet is currency
        </h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
          List your clothes and earn credits every time someone rents from you. No shipping. No hassle. Just campus.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register"
            className="bg-black text-white font-medium px-10 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-block">
            Start Listing Today
          </Link>
          <Link href="/marketplace"
            className="bg-white border border-gray-200 text-gray-900 font-medium px-10 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-block">
            Browse First
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 px-8 py-6 flex items-center justify-between">
        <Logo />
        <p className="text-xs text-gray-400">© 2026 · Syracuse University · Supporting UN SDG 12.5</p>
      </footer>

    </div>
  )
}