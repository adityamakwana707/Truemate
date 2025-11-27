import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongoose"
import { Verification } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'recent' // 'recent' or 'trending'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    await connectToDatabase()

    // Build query
    const query: any = { isPublic: true }

    if (category !== 'all') {
      query.category = category
    }

    if (search) {
      query.claim = { $regex: search, $options: 'i' }
    }

    // Build sort
    let sortQuery: any = {}
    if (sort === 'trending') {
      sortQuery = { views: -1, createdAt: -1 }
    } else {
      sortQuery = { createdAt: -1 }
    }

    // Get verifications
    const verifications = await Verification.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(offset)
      .populate('userId', 'name')
      .select('claim verdict confidence createdAt views category bookmarks')

    // Transform data for frontend
    const transformedVerifications = verifications.map(verification => ({
      id: verification._id.toString(),
      claim: verification.claim,
      verdict: verification.verdict,
      confidence: verification.confidence,
      timestamp: verification.createdAt.toISOString(),
      views: verification.views,
      bookmarks: verification.bookmarks.length,
      category: verification.category
    }))

    // Get stats
    const totalVerifications = await Verification.countDocuments({ isPublic: true })
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayVerifications = await Verification.countDocuments({
      isPublic: true,
      createdAt: { $gte: todayStart }
    })

    const misinformationCount = await Verification.countDocuments({
      isPublic: true,
      verdict: { $in: ['false', 'misleading'] },
      createdAt: { $gte: todayStart }
    })

    const activeUsersCount = await Verification.distinct('userId', {
      createdAt: { $gte: todayStart }
    }).then(users => users.length)

    return NextResponse.json({
      verifications: transformedVerifications,
      stats: {
        totalVerifications,
        todayVerifications,
        misinformationCount,
        activeUsersCount
      },
      pagination: {
        limit,
        offset,
        hasMore: verifications.length === limit
      }
    })

  } catch (error) {
    console.error("Explore API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}