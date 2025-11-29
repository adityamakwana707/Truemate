import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongoose"
import { Bookmark, Verification } from "@/lib/models"

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
        bookmarks: [],
        pagination: { limit, offset, total: 0, hasMore: false },
        message: 'Bookmarks temporarily unavailable'
      })
    }

    // Get user's bookmarks with verification details
    const bookmarks = await Bookmark.find({ userId: session.user.id })
      .populate({
        path: 'verificationId',
        select: 'claim verdict confidence createdAt category views'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)

    const transformedBookmarks = bookmarks
      .filter(bookmark => bookmark.verificationId) // Filter out deleted verifications
      .map(bookmark => ({
        id: bookmark._id.toString(),
        verificationId: bookmark.verificationId._id.toString(),
        claim: bookmark.verificationId.claim,
        verdict: bookmark.verificationId.verdict,
        confidence: bookmark.verificationId.confidence,
        category: bookmark.verificationId.category,
        views: bookmark.verificationId.views,
        notes: bookmark.notes,
        tags: bookmark.tags,
        bookmarkedAt: bookmark.createdAt.toISOString(),
        verifiedAt: bookmark.verificationId.createdAt.toISOString()
      }))

    const totalCount = await Bookmark.countDocuments({ userId: session.user.id })

    return NextResponse.json({
      bookmarks: transformedBookmarks,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: bookmarks.length === limit
      }
    })

  } catch (error) {
    console.error("Bookmarks API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { verificationId, notes, tags } = await request.json()

    if (!verificationId) {
      return NextResponse.json(
        { error: "Verification ID is required" },
        { status: 400 }
      )
    }

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }

    // Check if verification exists and is accessible
    const verification = await Verification.findById(verificationId)
    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      )
    }

    // Check if user can bookmark this verification
    const canBookmark = verification.isPublic || verification.userId.toString() === session.user.id
    if (!canBookmark) {
      return NextResponse.json(
        { error: "Cannot bookmark private verification" },
        { status: 403 }
      )
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      userId: session.user.id,
      verificationId
    })

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Already bookmarked" },
        { status: 409 }
      )
    }

    // Create bookmark
    const bookmark = new Bookmark({
      userId: session.user.id,
      verificationId,
      notes: notes || '',
      tags: tags || []
    })

    await bookmark.save()
    console.log('Bookmark created:', bookmark._id.toString())

    // Add to verification's bookmarks array
    await Verification.findByIdAndUpdate(verificationId, {
      $addToSet: { bookmarks: session.user.id }
    })
    console.log('Added user to verification bookmarks array')

    return NextResponse.json({
      success: true,
      message: "Bookmark added successfully",
      bookmarkId: bookmark._id.toString()
    }, { status: 201 })

  } catch (error) {
    console.error("Add bookmark error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookmarkId = searchParams.get('id')
    const verificationId = searchParams.get('verificationId')

    if (!bookmarkId && !verificationId) {
      return NextResponse.json(
        { error: "Bookmark ID or Verification ID is required" },
        { status: 400 }
      )
    }

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }

    let bookmark
    if (bookmarkId) {
      bookmark = await Bookmark.findById(bookmarkId)
    } else {
      bookmark = await Bookmark.findOne({
        userId: session.user.id,
        verificationId
      })
    }

    if (!bookmark || bookmark.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      )
    }

    // Remove bookmark
    await Bookmark.findByIdAndDelete(bookmark._id)

    // Remove from verification's bookmarks array
    await Verification.findByIdAndUpdate(bookmark.verificationId, {
      $pull: { bookmarks: session.user.id }
    })

    return NextResponse.json({
      message: "Bookmark removed successfully"
    })

  } catch (error) {
    console.error("Remove bookmark error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}