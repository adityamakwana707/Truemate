#!/usr/bin/env node

/**
 * MongoDB Atlas Database Initialization Script
 * Sets up indexes and initial data for TruthMate
 */

const { connectToDatabase } = require('./lib/mongoose')
const { User, Verification, Bookmark } = require('./lib/models')

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...')
    await connectToDatabase()
    
    console.log('✅ Connected to MongoDB Atlas')
    console.log('🔄 Setting up database indexes...')
    
    // Create indexes
    await User.createIndexes()
    await Verification.createIndexes()
    await Bookmark.createIndexes()
    
    console.log('✅ Database indexes created')
    
    // Check if demo user exists
    const demoUser = await User.findOne({ email: 'demo@truthmate.com' })
    
    if (!demoUser) {
      console.log('🔄 Creating demo user...')
      
      const newDemoUser = new User({
        name: 'Demo User',
        email: 'demo@truthmate.com',
        password: 'demo123'
      })
      
      await newDemoUser.save()
      console.log('✅ Demo user created (email: demo@truthmate.com, password: demo123)')
    } else {
      console.log('✅ Demo user already exists')
    }
    
    // Get database stats
    const userCount = await User.countDocuments()
    const verificationCount = await Verification.countDocuments()
    const bookmarkCount = await Bookmark.countDocuments()
    
    console.log('\n📊 Database Statistics:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Verifications: ${verificationCount}`)
    console.log(`   Bookmarks: ${bookmarkCount}`)
    
    console.log('\n🎉 Database initialization complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Update MONGODB_URI in .env.local with your Atlas connection string')
    console.log('   2. Run: npm run dev')
    console.log('   3. Visit: http://localhost:3000')
    console.log('   4. Login with: demo@truthmate.com / demo123')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error)
  process.exit(1)
})

// Run initialization
initializeDatabase()