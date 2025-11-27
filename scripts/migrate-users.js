#!/usr/bin/env node

/**
 * Database Migration Script - Clean User Schema
 * Removes unnecessary fields from existing user documents
 */

const { connectToDatabase } = require('../lib/mongoose')
const mongoose = require('mongoose')

async function migrateUsers() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...')
    await connectToDatabase()
    
    console.log('✅ Connected to MongoDB Atlas')
    console.log('🔄 Starting user schema migration...')
    
    const db = mongoose.connection.db
    const usersCollection = db.collection('users')
    
    // Check current user count
    const userCount = await usersCollection.countDocuments()
    console.log(`📊 Found ${userCount} users to migrate`)
    
    if (userCount === 0) {
      console.log('✅ No users found - migration complete')
      process.exit(0)
    }
    
    // Option 1: Clean migration - remove all unnecessary fields
    console.log('🔄 Removing unnecessary fields from user documents...')
    
    const updateResult = await usersCollection.updateMany(
      {}, // Apply to all documents
      {
        $unset: {
          apiKey: "",
          avatar: "",
          role: "",
          isVerified: "",
          verificationToken: "",
          resetPasswordToken: "",
          resetPasswordExpires: "",
          lastLogin: "",
          preferences: "",
          stats: "",
          __v: ""
        }
      }
    )
    
    console.log(`✅ Updated ${updateResult.modifiedCount} user documents`)
    
    // Verify the migration
    const sampleUser = await usersCollection.findOne({})
    if (sampleUser) {
      console.log('📋 Sample user document after migration:')
      console.log(JSON.stringify(sampleUser, null, 2))
    }
    
    console.log('🎉 User schema migration completed successfully!')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
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

// Run migration
migrateUsers()