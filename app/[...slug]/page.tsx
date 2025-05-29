import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata> {
  const title = params.slug.join(' - ')
  return {
    title: title ? `${title} - 기념일 앱` : '기념일 앱',
  }
}

export default function DynamicPage({
  params,
}: {
  params: { slug: string[] }
}) {
  if (params.slug.length === 0) {
    notFound()
  }

  const Component = dynamic(() =>
    import(`../../components/${params.slug[0]}`).then((mod) => mod.default)
  )

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  )
}
