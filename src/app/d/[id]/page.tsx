import { redirect } from 'next/navigation'

export const runtime = 'edge'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DoiRedirect({ params }: PageProps) {
  const { id } = await params
  
  const searchParams = new URLSearchParams({
    id,
    mode: 'doi'
  })
  
  redirect(`/?${searchParams.toString()}`)
}