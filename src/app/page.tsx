import { redirect } from 'next/navigation'

export default function HomePage() {
  // For now, redirect to /app/create
  // Later this can be a landing page
  redirect('/app/create')
}
