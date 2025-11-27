import { NextRequest, NextResponse } from "next/server"

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'healthy',
      database: 'not_configured',
      ml_service: 'unknown'
    }
  }

  // Check ML service health
  try {
    const mlHealthResponse = await fetch(`${ML_SERVICE_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      signal: AbortSignal.timeout(5000)
    })

    if (mlHealthResponse.ok) {
      const mlHealth = await mlHealthResponse.json()
      healthStatus.services.ml_service = mlHealth.model_loaded ? 'healthy' : 'model_not_loaded'
    } else {
      healthStatus.services.ml_service = 'unhealthy'
    }
  } catch (error) {
    healthStatus.services.ml_service = 'unreachable'
  }

  // Determine overall status
  const isHealthy = healthStatus.services.api === 'healthy' && 
                   healthStatus.services.ml_service !== 'unreachable'

  return NextResponse.json(
    healthStatus,
    { status: isHealthy ? 200 : 503 }
  )
}