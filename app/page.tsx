import { VideoGrid } from '@/components/VideoGrid'
import { SearchBar } from '@/components/SearchBar'
import { HeroSection } from '@/components/HeroSection'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <HeroSection />
      <SearchBar />
      <VideoGrid />
    </div>
  )
}