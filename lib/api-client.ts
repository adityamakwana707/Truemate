// API Client for TruthMate ML Services Integration

export interface VerificationRequest {
  text?: string
  url?: string
  image?: string
  public?: boolean
}

export interface VerificationResponse {
  verificationId: string
  timestamp: string
  claim: string
  extractedClaim?: string
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

export interface EvidenceItem {
  title: string
  url: string
  snippet: string
  credibility: number
  relevance: number
  stance: 'supports' | 'refutes' | 'neutral' | 'unknown'
}

export interface ImageAnalysis {
  authenticity: 'real' | 'fake' | 'ai-generated' | 'unknown'
  confidence: number
  analysis: {
    deepfake_probability: number
    manipulation_detected: boolean
    ai_generated_probability: number
  }
}

export interface VerificationMetadata {
  processingTimeMs: number
  isPublic: boolean
  userId?: string
  modelVersions: {
    classifier: string
    stance: string
    credibility: string
    explanation: string
  }
}

export class TruthMateAPI {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = '', apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Main verification endpoint
  async verifyContent(data: VerificationRequest): Promise<VerificationResponse> {
    return this.request('/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Individual model endpoints
  async classifyText(text: string) {
    return this.request('/models/classify', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
  }

  async analyzeStance(claim: string, article?: string, evidence_queries?: string[]) {
    return this.request('/models/stance', {
      method: 'POST',
      body: JSON.stringify({ claim, article, evidence_queries })
    })
  }

  async checkCredibility(url?: string, domain?: string, queries?: string[]) {
    return this.request('/models/credibility', {
      method: 'POST',
      body: JSON.stringify({ url, domain, queries })
    })
  }

  async extractClaim(url?: string, text?: string) {
    return this.request('/models/extract-claim', {
      method: 'POST',
      body: JSON.stringify({ url, text })
    })
  }

  async verifyImage(image?: string, image_url?: string) {
    return this.request('/models/verify-image', {
      method: 'POST',
      body: JSON.stringify({ image, image_url })
    })
  }

  async analyzeBiasSentiment(text: string) {
    return this.request('/models/bias-sentiment', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
  }

  async generateExplanation(data: {
    claim: string
    verdict: string
    confidence?: number
    evidence?: any[]
    credibility?: number
    bias?: string
  }) {
    return this.request('/models/generate-explanation', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Health check
  async health() {
    return this.request('/health')
  }
}

// Default client instance
export const truthMateAPI = new TruthMateAPI()

// Next.js fetch helper for client components
export async function verifyClaimClient(data: VerificationRequest): Promise<VerificationResponse> {
  const response = await fetch('/api/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `Failed to verify claim: ${response.status}`)
  }

  return response.json()
}