import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongoose"
import { Verification } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({
        verifications: [],
        stats: { total: 0, today: 0 },
        pagination: { limit, offset, hasMore: false },
        message: 'History temporarily unavailable'
      })
    }

    // Get user's verification history
    const verifications = await Verification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('claim verdict confidence createdAt isPublic views category')

    const transformedVerifications = verifications.map(verification => ({
      id: verification._id.toString(),
      claim: verification.claim,
      verdict: verification.verdict,
      confidence: verification.confidence,
      timestamp: verification.createdAt.toISOString(),
      isPublic: verification.isPublic,
      views: verification.views,
      category: verification.category
    }))

    // Get user stats
    const totalCount = await Verification.countDocuments({ userId: session.user.id })
    
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount = await Verification.countDocuments({
      userId: session.user.id,
      createdAt: { $gte: todayStart }
    })

    return NextResponse.json({
      verifications: transformedVerifications,
      stats: {
        total: totalCount,
        today: todayCount
      },
      pagination: {
        limit,
        offset,
        hasMore: verifications.length === limit
      }
    })

  } catch (error) {
    console.error("History API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}