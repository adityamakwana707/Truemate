# TruthMate API Integration Guide

## 🚀 Quick Setup

Your TruthMate platform now has comprehensive API endpoints ready for Python ML model integration. Here's how to connect everything:

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Core ML Service Settings
ML_SERVICE_URL=http://localhost:5000  # Your Flask/FastAPI service
ML_SERVICE_API_KEY=your-secure-api-key

# NextAuth (for authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 2. Available API Endpoints

#### 🎯 Main Verification Endpoint
- **POST** `/api/verify` - Complete fact-checking pipeline
- **GET** `/api/health` - System health check

#### 🧠 Individual Model Endpoints
- **POST** `/api/models/classify` - Direct text classification
- **POST** `/api/models/stance` - Stance detection analysis  
- **POST** `/api/models/credibility` - Source credibility scoring
- **POST** `/api/models/extract-claim` - Claim extraction from URLs/text
- **POST** `/api/models/verify-image` - Image authenticity verification
- **POST** `/api/models/bias-sentiment` - Bias and sentiment analysis
- **POST** `/api/models/generate-explanation` - Generate explanations

## 🔌 Python Flask Integration

Your Flask service should implement these endpoints:

```python
# Expected Flask endpoints that match the API calls
@app.route('/verify', methods=['POST'])           # Main classification
@app.route('/stance-detection', methods=['POST']) # Stance analysis
@app.route('/source-credibility', methods=['POST']) # Source scoring
@app.route('/extract-claim', methods=['POST'])     # Claim extraction
@app.route('/verify-image', methods=['POST'])      # Image verification
@app.route('/bias-sentiment', methods=['POST'])    # Bias/sentiment
@app.route('/generate-explanation', methods=['POST']) # Explanations
@app.route('/health', methods=['GET'])             # Health check
```

## 📊 API Flow Architecture

### Complete Verification Pipeline (`/api/verify`)
1. **Claim Extraction** (if URL provided)
2. **Main Classification** (True/False/Misleading/Unknown)
3. **Parallel Evidence Gathering**:
   - Stance detection on related articles
   - Source credibility analysis
   - Bias and sentiment analysis
4. **Optional Image Verification** (if image provided)
5. **Explanation Generation**
6. **Response Compilation** with metadata

### Individual Model Access
Each model can be called independently for specialized analysis.

## 🛡️ Security Features

- **Authentication**: All endpoints (except health) require valid session
- **Rate Limiting**: Configurable request limits
- **Timeout Handling**: 10-20s timeouts with graceful fallbacks
- **Error Recovery**: Fallback responses when ML services are unavailable
- **API Key Protection**: Secure ML service communication

## 🎮 Frontend Integration

The frontend is already integrated! Your `ClaimInputCard` component automatically calls the new API:

```typescript
// Frontend automatically uses new API
const response = await fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify({ text, url, public: isPublic })
})
```

## 📝 Response Format

```typescript
interface VerificationResponse {
  verificationId: string
  timestamp: string
  claim: string
  verdict: 'True' | 'False' | 'Misleading' | 'Unknown'
  confidence: number
  explanation: string
  reasoning: string
  evidence: EvidenceItem[]
  sourceCredibility: number
  harmIndex: 'low' | 'medium' | 'high'
  bias: string
  sentiment: string
  emotion: string
  imageAnalysis?: ImageAnalysis
  metadata: VerificationMetadata
}
```

## 🧪 Testing Your Integration

1. **Start your Flask service** on `localhost:5000`
2. **Run TruthMate** with `npm run dev`
3. **Test health check**: `GET http://localhost:3000/api/health`
4. **Submit a claim** through the dashboard UI
5. **Monitor logs** for ML service calls and responses

## 🚀 Deployment Strategy

### Next.js (Vercel)
- Deploy main platform to Vercel
- Configure environment variables
- Set `ML_SERVICE_URL` to your Python service URL

### Python Models (Separate)
- Deploy Flask/FastAPI service independently
- Use Railway, Render, or AWS
- Ensure CORS and authentication headers

## 💡 Pro Tips

1. **Graceful Degradation**: The API provides fallback responses when ML services are down
2. **Parallel Processing**: Evidence gathering runs in parallel for speed
3. **Modular Design**: Each model can be deployed and scaled independently  
4. **Type Safety**: Full TypeScript interfaces for all API interactions
5. **Monitoring Ready**: Built-in logging and error tracking

Your TruthMate platform is now ready for ML model integration! 🎉