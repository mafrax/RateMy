// Core entity types
export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  password: string | null
  avatar: string | null
  city: string | null
  birthDay: Date | null
  gender: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Video {
  id: string
  title: string
  originalUrl: string
  embedUrl: string
  thumbnail: string | null
  previewUrl: string | null
  description: string | null
  isNsfw: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
  tags?: VideoTag[]
  ratings?: Rating[]
  _count?: {
    ratings: number
  }
}

export interface Tag {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface VideoTag {
  id: string
  videoId: string
  tagId: string
  tag: Tag
  video?: Video
}

export interface Rating {
  id: string
  videoId: string
  userId: string
  tagId: string
  level: number
  createdAt: Date
  updatedAt: Date
  video?: Video
  user?: User
  tag: Tag
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
  follower?: User
  following?: User
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface SignInForm {
  email: string
  password: string
}

export interface SignUpForm {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export interface VideoUploadForm {
  title: string
  originalUrl: string
  description: string
  tags: string
}

export interface VideoRatingForm {
  tagId: string
  level: number
}

// Tag rating filter type
export interface TagRatingFilter {
  tagName: string
  minRating: number
  maxRating: number
}

// Search and filter types
export interface VideoFilters {
  search?: string
  tags?: string[]
  tagRatings?: TagRatingFilter[]
  includeNsfw?: boolean
  userId?: string
  sortBy?: 'createdAt' | 'title' | 'ratings'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface VideoGridState extends LoadingState {
  videos: Video[]
  hasMore: boolean
  page: number
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  username: string | null
  firstName?: string | null
  lastName?: string | null
}

export interface Session {
  user: AuthUser
  expires: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}

// Configuration types
export interface DatabaseConfig {
  url: string
  maxConnections?: number
  timeout?: number
}

export interface NextAuthConfig {
  secret: string
  url: string
  providers: any[]
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Component props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface VideoCardProps extends BaseComponentProps {
  video: Video
  onRate?: (videoId: string, tagId: string, level: number) => void
}

export interface VideoGridProps extends BaseComponentProps {
  videos: Video[]
  loading?: boolean
  error?: string | null
  onLoadMore?: () => void
  hasMore?: boolean
}

export interface SearchBarProps extends BaseComponentProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: VideoFilters) => void
  initialFilters?: VideoFilters
}

// Service types
export interface VideoService {
  getVideos(filters?: VideoFilters): Promise<PaginatedResponse<Video>>
  getVideoById(id: string): Promise<ApiResponse<Video>>
  createVideo(data: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Video>>
  updateVideo(id: string, data: Partial<Video>): Promise<ApiResponse<Video>>
  deleteVideo(id: string): Promise<ApiResponse<void>>
  rateVideo(videoId: string, tagId: string, level: number): Promise<ApiResponse<Rating>>
}

export interface UserService {
  getUserById(id: string): Promise<ApiResponse<User>>
  updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>>
  followUser(userId: string): Promise<ApiResponse<Follow>>
  unfollowUser(userId: string): Promise<ApiResponse<void>>
}

export interface AuthService {
  signIn(credentials: SignInForm): Promise<ApiResponse<Session>>
  signUp(data: SignUpForm): Promise<ApiResponse<User>>
  signOut(): Promise<void>
  getCurrentUser(): Promise<ApiResponse<User>>
}

// Database repository types
export interface Repository<T> {
  findById(id: string): Promise<T | null>
  findMany(filters?: any): Promise<T[]>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

export interface VideoRepository extends Repository<Video> {
  findByUserId(userId: string): Promise<Video[]>
  findByTags(tags: string[]): Promise<Video[]>
  search(query: string): Promise<Video[]>
  findWithRatings(id: string): Promise<Video | null>
}

export interface UserRepository extends Repository<User> {
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findFollowers(userId: string): Promise<User[]>
  findFollowing(userId: string): Promise<User[]>
}

// Event types
export interface VideoEvent {
  type: 'video:created' | 'video:updated' | 'video:deleted' | 'video:rated'
  data: Video | Rating
  userId: string
  timestamp: Date
}

export interface UserEvent {
  type: 'user:created' | 'user:updated' | 'user:followed'
  data: User | Follow
  timestamp: Date
}

export type AppEvent = VideoEvent | UserEvent