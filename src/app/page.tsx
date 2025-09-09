import { Suspense } from 'react'
import HomePage from '@/components/HomePage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  )
}