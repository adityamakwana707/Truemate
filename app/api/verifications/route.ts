import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongoose'
import { Verification } from '@/lib/models'

// POST - Save a new verification result
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      claim,
      claimType = 'text',
      verdict,
      confidence,
      explanation,
      reasoning,
      sourceCredibility = 0,
      harmIndex: rawHarmIndex = 'low',
      evidence = [],
      category = 'other',
      isPublic = true,
      metadata = {}
    } = body

    // Convert harmIndex to expected enum values
    const normalizeHarmIndex = (value: any): string => {
      if (typeof value === 'string' && ['low', 'medium', 'high', 'critical'].includes(value.toLowerCase())) {
        return value.toLowerCase()
      }
      
      // Convert numeric values to string categories
      const numValue = typeof value === 'string' ? parseInt(value) : Number(value)
      if (!isNaN(numValue)) {
        if (numValue <= 25) return 'low'
        if (numValue <= 50) return 'medium' 
        if (numValue <= 75) return 'high'
        return 'critical'
      }
      
      return 'low' // default fallback
    }

    // Normalize verdict to expected enum values
    const normalizeVerdict = (value: any): string => {
      const verdictStr = String(value).toLowerCase().trim()
      if (['true', 'false', 'misleading', 'unknown'].includes(verdictStr)) {
        return verdictStr
      }
      // Handle common variations
      if (verdictStr === 't' || verdictStr === 'correct' || verdictStr === 'accurate') return 'true'
      if (verdictStr === 'f' || verdictStr === 'incorrect' || verdictStr === 'inaccurate') return 'false'
      if (verdictStr === 'partial' || verdictStr === 'mixed') return 'misleading'
      return 'unknown' // default fallback
    }

    const harmIndex = normalizeHarmIndex(rawHarmIndex)
    const normalizedVerdict = normalizeVerdict(verdict)

    if (!claim || !verdict || confidence === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: claim, verdict, confidence' },
        { status: 400 }
      )
    }

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Verification completed but not saved to history.' },
        { status: 503 }
      )
    }

    // Check if this exact verification already exists for this user
    const existingVerification = await Verification.findOne({
      userId: session.user.id,
      claim: claim.trim(),
      createdAt: { 
        $gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
      }
    })

    if (existingVerification) {
      return NextResponse.json({ 
        success: true, 
        verification: existingVerification,
        message: 'Verification already exists'
      })
    }

    // Create new verification
    const verification = new Verification({
      userId: session.user.id,
      claim: claim.trim(),
      claimType,
      verdict: normalizedVerdict,
      confidence,
      explanation,
      reasoning,
      sourceCredibility,
      harmIndex,
      evidence,
      category,
      isPublic,
      metadata: {
        ...metadata,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        processingTime: metadata.processingTime || 0,
        aiModel: metadata.aiModel || 'python-server',
        sourceCount: evidence.length || 0
      }
    })

    await verification.save()

    return NextResponse.json({ 
      success: true, 
      verification: verification.toObject()
    })

  } catch (error) {
    console.error('Error saving verification:', error)
    return NextResponse.json(
      { error: 'Failed to save verification' },
      { status: 500 }
    )
  }
}

// GET - Fetch user's verification history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const verdict = searchParams.get('verdict')
    const search = searchParams.get('search')

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { 
          success: true,
          verifications: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
          message: 'Database temporarily unavailable'
        }
      )
    }

    // Build query
    const query: any = { userId: session.user.id }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (verdict && verdict !== 'all') {
      query.verdict = verdict
    }
    
    if (search) {
      query.claim = { $regex: search, $options: 'i' }
    }

    // Get total count
    const totalCount = await Verification.countDocuments(query)

    // Get paginated results
    const verifications = await Verification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-userId') // Don't send userId back to client
      .lean()

    return NextResponse.json({
      success: true,
      verifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching verifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification history' },
      { status: 500 }
    )
  }
}