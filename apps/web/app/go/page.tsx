import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

// /go?ref=yoursite.com&creative=1&size=300x250
// Redirects to /register with UTM params preserved for analytics
export default function TrackingRedirect({
  searchParams,
}: {
  searchParams: { ref?: string; creative?: string; size?: string }
}) {
  const params = new URLSearchParams()
  params.set('utm_source', searchParams.ref ?? 'banner')
  params.set('utm_medium', 'display')
  params.set('utm_campaign', 'blockcoin-ads')
  if (searchParams.creative) params.set('utm_content', `creative-${searchParams.creative}`)
  if (searchParams.size) params.set('utm_term', searchParams.size)

  redirect(`/register?${params.toString()}`)
}
