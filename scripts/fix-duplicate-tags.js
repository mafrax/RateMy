const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDuplicateTags() {
  console.log('Starting tag deduplication...')
  
  // Get all tags
  const allTags = await prisma.tag.findMany({
    include: {
      videos: true,
      ratings: true
    }
  })
  
  console.log(`Found ${allTags.length} total tags`)
  
  // Group tags by lowercase name
  const tagGroups = {}
  allTags.forEach(tag => {
    const lowerName = tag.name.toLowerCase()
    if (!tagGroups[lowerName]) {
      tagGroups[lowerName] = []
    }
    tagGroups[lowerName].push(tag)
  })
  
  // Process each group
  for (const [lowerName, tags] of Object.entries(tagGroups)) {
    if (tags.length > 1) {
      console.log(`Processing duplicate tags for "${lowerName}":`, tags.map(t => t.name))
      
      // Sort tags by creation date (keep the oldest one as primary)
      tags.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      const primaryTag = tags[0]
      const duplicateTags = tags.slice(1)
      
      console.log(`  Primary tag: "${primaryTag.name}" (${primaryTag.id})`)
      
      // For each duplicate tag, move its relationships to the primary tag
      for (const duplicateTag of duplicateTags) {
        console.log(`  Merging duplicate: "${duplicateTag.name}" (${duplicateTag.id})`)
        
        // Update video-tag relationships
        await prisma.videoTag.updateMany({
          where: { tagId: duplicateTag.id },
          data: { tagId: primaryTag.id }
        })
        
        // Handle ratings more carefully due to unique constraints
        const duplicateRatings = await prisma.rating.findMany({
          where: { tagId: duplicateTag.id }
        })
        
        for (const rating of duplicateRatings) {
          // Check if there's already a rating for this video/user/primary tag
          const existingRating = await prisma.rating.findUnique({
            where: {
              videoId_userId_tagId: {
                videoId: rating.videoId,
                userId: rating.userId,
                tagId: primaryTag.id
              }
            }
          })
          
          if (existingRating) {
            console.log(`    Conflict: Rating already exists for video ${rating.videoId}, user ${rating.userId}, tag ${primaryTag.name}`)
            // Keep the newer rating (or you could average them)
            if (rating.updatedAt > existingRating.updatedAt) {
              await prisma.rating.update({
                where: { id: existingRating.id },
                data: { level: rating.level, updatedAt: rating.updatedAt }
              })
              console.log(`      Updated existing rating to ${rating.level}`)
            }
            // Delete the duplicate rating
            await prisma.rating.delete({ where: { id: rating.id } })
          } else {
            // No conflict, just update the tagId
            await prisma.rating.update({
              where: { id: rating.id },
              data: { tagId: primaryTag.id }
            })
          }
        }
        
        // Delete the duplicate tag
        await prisma.tag.delete({
          where: { id: duplicateTag.id }
        })
        
        console.log(`    Deleted duplicate tag "${duplicateTag.name}"`)
      }
      
      // Update primary tag name to lowercase if it isn't already
      if (primaryTag.name !== lowerName) {
        await prisma.tag.update({
          where: { id: primaryTag.id },
          data: { name: lowerName }
        })
        console.log(`  Updated primary tag name to "${lowerName}"`)
      }
    }
  }
  
  console.log('Tag deduplication completed!')
}

fixDuplicateTags()
  .catch(console.error)
  .finally(() => prisma.$disconnect())