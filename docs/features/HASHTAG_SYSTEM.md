# Hashtag System

Click hashtags to discover similar locations on the map with colored circles.

## Usage
1. Right-click map → pin location
2. Click hashtags → see matches
3. Click circles → explore locations

## API
- `POST /api/vibe/analyze` - Analyze location
- `POST /api/vibe/similar` - Find similar
- `GET /api/vibe/hashtag/{tag}` - Search by tag

## Performance
- Cached: <50ms
- Uncached: 2-5s
