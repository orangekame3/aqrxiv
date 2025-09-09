import { redirect } from 'next/navigation'

export const runtime = 'edge'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AbsRedirect({ params }: PageProps) {
  const { id } = await params
  
  const searchParams = new URLSearchParams({
    id
  })
  
  redirect(`/?${searchParams.toString()}`)
}