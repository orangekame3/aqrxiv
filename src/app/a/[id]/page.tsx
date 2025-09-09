import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AbsRedirect({ params }: PageProps) {
  const { id } = await params
  
  const searchParams = new URLSearchParams({
    id,
    mode: 'abs'
  })
  
  redirect(`/?${searchParams.toString()}`)
}