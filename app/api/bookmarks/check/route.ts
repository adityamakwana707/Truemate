import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongoose"
import { Bookmark } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        bookmarked: {}
      })
    }

    const { verificationIds } = await request.json()

    if (!verificationIds || !Array.isArray(verificationIds)) {
      return NextResponse.json(
        { error: "Verification IDs array is required" },
        { status: 400 }
      )
    }

    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({
        bookmarked: {}
      })
    }

    // Get bookmarks for all verification IDs
    const bookmarks = await Bookmark.find({
      userId: session.user.id,
      verificationId: { $in: verificationIds }
    }).select('verificationId')

    // Create lookup object
    const bookmarkedMap = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.verificationId.toString()] = true
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json({
      bookmarked: bookmarkedMap
    })

  } catch (error) {
    console.error("Check bookmark status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}