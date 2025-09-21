import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoCard } from '../../../components/VideoCard'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}))

describe('VideoCard', () => {
  const mockVideo = {
    id: 'video123',
    title: 'Test Video',
    originalUrl: 'https://example.com/video',
    embedUrl: 'https://example.com/embed',
    thumbnail: 'https://example.com/thumb.jpg',
    description: 'Test video description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user123',
    tags: [
      { id: 'tag1', name: 'comedy' },
      { id: 'tag2', name: 'music' }
    ],
    ratings: [
      { id: 'rating1', value: 4, userId: 'user1', tagId: 'tag1' },
      { id: 'rating2', value: 5, userId: 'user2', tagId: 'tag2' }
    ]
  }

  it('should render video information correctly', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.getByText('Test video description')).toBeInTheDocument()
    expect(screen.getByText('comedy')).toBeInTheDocument()
    expect(screen.getByText('music')).toBeInTheDocument()
  })

  it('should display video thumbnail', () => {
    render(<VideoCard video={mockVideo} />)

    const thumbnail = screen.getByRole('img', { name: /test video/i })
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('should show fallback image when thumbnail is not available', () => {
    const videoWithoutThumbnail = {
      ...mockVideo,
      thumbnail: null
    }

    render(<VideoCard video={videoWithoutThumbnail} />)

    const thumbnail = screen.getByRole('img', { name: /test video/i })
    expect(thumbnail).toBeInTheDocument()
    // Should use a fallback image or placeholder
    expect(thumbnail).toHaveAttribute('src', expect.stringContaining('placeholder'))
  })

  it('should handle click events', async () => {
    const onVideoClick = jest.fn()
    
    render(<VideoCard video={mockVideo} onVideoClick={onVideoClick} />)

    const videoCard = screen.getByTestId('video-card') || screen.getByText('Test Video').closest('div')
    
    if (videoCard) {
      fireEvent.click(videoCard)
      
      await waitFor(() => {
        expect(onVideoClick).toHaveBeenCalledWith(mockVideo)
      })
    }
  })

  it('should display average rating when ratings are provided', () => {
    render(<VideoCard video={mockVideo} showRating />)

    // Average of ratings (4 + 5) / 2 = 4.5
    expect(screen.getByText(/4\.5/)).toBeInTheDocument()
    expect(screen.getByText(/★/)).toBeInTheDocument()
  })

  it('should not display rating when showRating is false', () => {
    render(<VideoCard video={mockVideo} showRating={false} />)

    expect(screen.queryByText(/★/)).not.toBeInTheDocument()
  })

  it('should display "No rating" when no ratings are provided', () => {
    const videoWithoutRatings = {
      ...mockVideo,
      ratings: []
    }

    render(<VideoCard video={videoWithoutRatings} showRating />)

    expect(screen.getByText(/no rating/i)).toBeInTheDocument()
  })

  it('should limit displayed tags when many tags are present', () => {
    const videoWithManyTags = {
      ...mockVideo,
      tags: Array.from({ length: 10 }, (_, i) => ({
        id: `tag${i}`,
        name: `tag${i}`
      }))
    }

    render(<VideoCard video={videoWithManyTags} />)

    // Should show only first few tags and "..." or "+X more"
    const tags = screen.getAllByTestId(/tag-/)
    expect(tags.length).toBeLessThanOrEqual(5) // Assuming max 5 tags displayed
  })

  it('should handle long titles gracefully', () => {
    const videoWithLongTitle = {
      ...mockVideo,
      title: 'This is a very long video title that should be truncated or handled gracefully in the UI'
    }

    render(<VideoCard video={videoWithLongTitle} />)

    const titleElement = screen.getByText(/this is a very long video title/i)
    expect(titleElement).toBeInTheDocument()
    
    // Check if title is truncated (assuming CSS truncation)
    expect(titleElement).toHaveStyle('text-overflow: ellipsis') ||
    expect(titleElement.textContent).toMatch(/\.{3}$/) // ends with ellipsis
  })

  it('should be accessible', () => {
    render(<VideoCard video={mockVideo} />)

    // Check for proper ARIA attributes
    const videoCard = screen.getByRole('article') || screen.getByTestId('video-card')
    expect(videoCard).toBeInTheDocument()

    // Check for proper heading structure
    const title = screen.getByRole('heading', { name: /test video/i })
    expect(title).toBeInTheDocument()

    // Check for proper image alt text
    const thumbnail = screen.getByRole('img')
    expect(thumbnail).toHaveAttribute('alt', expect.stringContaining('Test Video'))
  })

  it('should handle missing optional properties', () => {
    const minimalVideo = {
      id: 'video123',
      title: 'Minimal Video',
      originalUrl: 'https://example.com/video',
      embedUrl: 'https://example.com/embed',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user123',
      tags: [],
      ratings: []
    }

    expect(() => render(<VideoCard video={minimalVideo} />)).not.toThrow()
    
    expect(screen.getByText('Minimal Video')).toBeInTheDocument()
  })

  it('should display upload date', () => {
    render(<VideoCard video={mockVideo} showDate />)

    // Should show formatted date
    expect(screen.getByText(/jan/i)).toBeInTheDocument() ||
    expect(screen.getByText(/january/i)).toBeInTheDocument() ||
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('should handle video loading states', () => {
    const loadingVideo = {
      ...mockVideo,
      thumbnail: 'loading'
    }

    render(<VideoCard video={loadingVideo} isLoading />)

    // Should show loading skeleton or placeholder
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument() ||
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})