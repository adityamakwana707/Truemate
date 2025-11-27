# MongoDB Atlas Setup Guide for TruthMate

## Prerequisites
- MongoDB Atlas account (free tier available)
- Node.js installed locally

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up for MongoDB Atlas**: https://cloud.mongodb.com/
2. **Create a new project** called "TruthMate"
3. **Build a Database** - Choose the free tier (M0 Sandbox)
4. **Choose a cloud provider and region** closest to your location
5. **Create cluster** - Wait for deployment (2-5 minutes)

## Step 2: Configure Database Access

### Create Database User
1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Authentication Method: **Password**
4. Username: `truthmate-user` (or your preferred username)
5. Password: Generate a secure password and save it
6. Database User Privileges: **Built-in Role** → **Read and write to any database**
7. Click **Add User**

### Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
4. For production: Add your specific IP addresses
5. Click **Confirm**

## Step 3: Get Connection String

1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 4: Configure TruthMate

1. **Update .env.local** with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://truthmate-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/truthmate?retryWrites=true&w=majority
   ```
   
   Replace:
   - `truthmate-user` with your database username
   - `YOUR_PASSWORD` with your database password
   - `cluster0.xxxxx` with your actual cluster URL
   - Added `/truthmate` as the database name

2. **Install dependencies** (if not already done):
   ```bash
   npm install mongodb mongoose bcryptjs @types/bcryptjs
   ```

3. **Initialize the database**:
   ```bash
   npm run init-db
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Step 5: Test the Setup

1. Visit http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Create a new account or use the demo account:
   - Email: `demo@truthmate.com`
   - Password: `demo123`
4. Try verifying a claim to test database functionality

## Database Schema

The application automatically creates the following collections:

### Users Collection
- User profiles and authentication
- Preferences and settings
- Usage statistics

### Verifications Collection
- Fact-checking results
- Evidence and sources
- Public/private visibility settings

### Bookmarks Collection
- User-saved verifications
- Personal notes and tags

## Security Best Practices

### For Production:
1. **Restrict Network Access**: Remove 0.0.0.0/0 and add specific IP addresses
2. **Use Connection String Secrets**: Store in environment variables
3. **Enable Database Auditing**: Monitor database access
4. **Regular Backups**: Enable automated backups in Atlas
5. **Update Dependencies**: Keep packages updated

### Connection String Security:
- Never commit `.env.local` to version control
- Use different databases for development/staging/production
- Rotate database passwords regularly
- Monitor connection logs for suspicious activity

## Troubleshooting

### Common Issues:

1. **Connection Timeout**:
   - Check network access whitelist
   - Verify connection string format
   - Ensure cluster is running

2. **Authentication Failed**:
   - Double-check username/password
   - Ensure user has proper permissions
   - Check for special characters in password (URL encode if needed)

3. **Database Not Found**:
   - Database will be created automatically on first connection
   - Ensure connection string includes database name: `/truthmate`

4. **Performance Issues**:
   - Free tier (M0) has limited resources
   - Consider upgrading for production use
   - Monitor Atlas metrics for bottlenecks

### Debug Commands:

```bash
# Test database connection
npm run init-db

# Check environment variables
node -e "console.log(process.env.MONGODB_URI)"

# View application logs
npm run dev
```

## Monitoring and Maintenance

### Atlas Dashboard Features:
- **Metrics**: Monitor performance and usage
- **Profiler**: Identify slow queries
- **Alerts**: Set up notifications for issues
- **Backup**: Configure automated backups

### Application Monitoring:
- Check user registration/login success rates
- Monitor verification processing times
- Track API error rates
- Review database query performance

## Scaling Considerations

### For Growing Usage:
1. **Upgrade Cluster Tier**: Move from M0 to M2+ for better performance
2. **Add Read Replicas**: Distribute read operations
3. **Implement Caching**: Use Redis for frequently accessed data
4. **Optimize Queries**: Add indexes for common search patterns
5. **Archive Old Data**: Move old verifications to separate collections

---

## Need Help?

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- TruthMate Issues: Create an issue in the repository
- MongoDB Community: https://community.mongodb.com/