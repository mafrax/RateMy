# Migration Scripts

## RedGifs URL Migration Script

The `fix-redgifs-urls.js` script fixes existing RedGifs URLs that are stored in the wrong format (using `/watch/` instead of `/ifr/` for embed URLs).

### Usage

```bash
# Check what would be changed (dry run)
node scripts/fix-redgifs-urls.js --dry-run

# Test the URL conversion logic
node scripts/fix-redgifs-urls.js --test

# Run the actual migration
node scripts/fix-redgifs-urls.js
```

### What it does

1. **Finds videos** with RedGifs original URLs that have incorrect embed URLs
2. **Extracts the video ID** from the original URL
3. **Updates the embed URL** to use the correct `/ifr/` format
4. **Provides detailed logging** of the migration process

### URL Format Conversion

The script converts RedGifs URLs from:
- `https://www.redgifs.com/watch/gracefulcleargiraffe` 
- To: `https://www.redgifs.com/ifr/gracefulcleargiraffe`

### Safety Features

- **Dry run mode**: See what would be changed without making any updates
- **Detailed logging**: Shows exactly what's being changed
- **Error handling**: Continues processing even if individual videos fail
- **Summary report**: Shows how many videos were successfully updated vs errors

### When to use

- After importing videos with incorrect RedGifs URLs
- When RedGifs videos aren't displaying correctly due to wrong embed URLs
- As part of maintenance to ensure all RedGifs URLs are in the correct format