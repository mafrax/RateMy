const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Common adult content tags for better categorization
const ADULT_TAGS = [
  // Demographics
  'teen', 'milf', 'mature', 'granny', 'young', 'college',
  'blonde', 'brunette', 'redhead', 'asian', 'latina', 'ebony',
  'amateur', 'professional', 'pornstar',
  
  // Body types & features
  'big-tits', 'small-tits', 'natural-tits', 'fake-tits',
  'big-ass', 'small-ass', 'curvy', 'thin', 'bbw', 'petite',
  'tattoo', 'piercing', 'hairy', 'shaved',
  
  // Activities
  'solo', 'masturbation', 'fingering', 'toys', 'dildo', 'vibrator',
  'blowjob', 'deepthroat', 'handjob', 'footjob', 'titjob',
  'anal', 'dp', 'dvp', 'dap', 'gape',
  'oral', 'cunnilingus', '69', 'rimming',
  'cumshot', 'facial', 'creampie', 'swallow', 'bukkake',
  'squirting', 'pissing', 'watersports',
  
  // Scenarios & fetishes
  'massage', 'stripteasing', 'dancing', 'shower', 'bath',
  'outdoor', 'public', 'upskirt', 'voyeur',
  'roleplay', 'uniform', 'schoolgirl', 'nurse', 'secretary',
  'bdsm', 'bondage', 'domination', 'submission', 'spanking',
  'fetish', 'latex', 'leather', 'stockings', 'pantyhose',
  'interracial', 'bbc', 'gangbang', 'orgy',
  
  // Relationships
  'couple', 'threesome', 'foursome', 'group',
  'lesbian', 'gay', 'bisexual', 'trans', 'shemale',
  'cheating', 'cuckold', 'wife', 'girlfriend',
  
  // Locations
  'bedroom', 'bathroom', 'kitchen', 'office', 'car',
  'hotel', 'beach', 'pool', 'gym',
  
  // Production quality
  'hd', '4k', 'pov', 'vr', '60fps',
  'webcam', 'cam-girl', 'chaturbate', 'onlyfans',
  'homemade', 'private', 'leaked'
]

async function addAdultTags() {
  console.log('🔞 Adding adult content tags to database...\n')

  let createdCount = 0
  let existingCount = 0

  try {
    for (const tagName of ADULT_TAGS) {
      try {
        const tag = await prisma.tag.create({
          data: { name: tagName }
        })
        createdCount++
        console.log(`✅ Created tag: ${tagName}`)
      } catch (error) {
        if (error.code === 'P2002') {
          // Tag already exists
          existingCount++
          console.log(`⚪ Tag already exists: ${tagName}`)
        } else {
          console.error(`❌ Failed to create tag ${tagName}:`, error.message)
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`✅ Created: ${createdCount} new tags`)
    console.log(`⚪ Existing: ${existingCount} tags`)
    console.log(`🔢 Total processed: ${ADULT_TAGS.length} tags`)

    // Get final tag count
    const totalTags = await prisma.tag.count()
    console.log(`🗃️  Total tags in database: ${totalTags}`)

    console.log(`\n🎯 These tags are now available for XHamster videos extraction!`)
    console.log(`📝 The improved XHamsterService will automatically match content to these tags`)

  } catch (error) {
    console.error('❌ Failed to add adult tags:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addAdultTags()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { addAdultTags }