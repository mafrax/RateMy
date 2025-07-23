import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Rate and Discover Amazing Videos
          </h1>
          <p className="mt-6 text-lg leading-8 text-primary-100">
            Share your favorite videos, rate them with custom tags, and discover content through community-driven ratings.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/upload"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Upload Video
            </Link>
            <Link
              href="/videos"
              className="text-sm font-semibold leading-6 text-white hover:text-primary-100"
            >
              Browse Videos <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}