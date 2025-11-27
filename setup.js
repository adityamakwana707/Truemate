#!/usr/bin/env node

/**
 * TruthMate Phase 1 Setup Script
 * Automated setup for MongoDB Atlas integration and development environment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 TruthMate Phase 1 Setup');
  console.log('================================\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file already exists');
    
    const shouldUpdate = await question('Do you want to update MongoDB Atlas configuration? (y/n): ');
    
    if (shouldUpdate.toLowerCase() === 'y') {
      await updateMongoDBConfig(envPath);
    }
  } else {
    console.log('❌ .env.local file not found');
    await createEnvironmentFile(envPath);
  }

  console.log('\n🔧 Next Steps:');
  console.log('1. Set up MongoDB Atlas cluster (see MONGODB_ATLAS_SETUP.md)');
  console.log('2. Update MONGODB_URI in .env.local with your connection string');
  console.log('3. Generate a secure NEXTAUTH_SECRET');
  console.log('4. Run: npm run dev');
  console.log('5. Test authentication flow at http://localhost:3000/signup');

  rl.close();
}

async function updateMongoDBConfig(envPath) {
  const mongoUri = await question('Enter your MongoDB Atlas connection string: ');
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /MONGODB_URI=.*/,
    `MONGODB_URI=${mongoUri}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated MongoDB configuration');
}

async function createEnvironmentFile(envPath) {
  const envTemplate = `# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/truthmate?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=${generateSecret()}
NEXTAUTH_URL=http://localhost:3000

# Python Backend Configuration
PYTHON_BACKEND_URL=http://localhost:8000

# Development Settings
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file');
}

function generateSecret() {
  return require('crypto').randomBytes(32).toString('base64');
}

// Run setup
setupEnvironment().catch(console.error);