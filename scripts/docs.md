# Scripts Documentation

## Upload Trending RedGifs Script

Automatically uploads the 10 most trending gifs from RedGifs to your RateMy platform.

### Usage

```bash
node scripts/upload-trending-redgifs.js <email> <password>
```

### What it does:
1. Authenticates user credentials 
2. Fetches 10 trending gifs from RedGifs API
3. Checks for duplicates (skips existing videos)
4. Uploads new gifs with proper metadata
5. Auto-marks all RedGifs as NSFW
6. Provides detailed progress reports

### Features:
- Smart deduplication 
- Error handling & fallback support
- Direct database access when needed
- Rate limiting between uploads
- Real-time progress tracking