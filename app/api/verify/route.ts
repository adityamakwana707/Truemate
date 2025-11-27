import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongoose"
import { Verification, User } from "@/lib/models"
import type { IVerification } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const formData = await request.formData()
    const text = formData.get('text') as string
    const url = formData.get('url') as string
    const isPublic = formData.get('public') === 'true'

    if (!text && !url) {
      return NextResponse.json(
        { error: "Either text or URL is required" },
        { status: 400 }
      )
    }

    const claim = text || url
    const claimType = url ? 'url' : 'text'

    // TODO: Replace with actual AI verification logic
    // For now, we'll create mock verification results
    const mockVerification = {
      verdict: 'unknown' as const,
      confidence: 50,
      explanation: "This is a demo verification. Connect to AI backend for real analysis.",
      reasoning: "Frontend-only demo - no AI processing available yet.",
      sourceCredibility: 50,
      harmIndex: 'low' as const,
      evidence: [{
        title: "Demo Source",
        link: "#",
        snippet: "This is mock evidence for the frontend demo.",
        credibility: 0.5,
        relevance: 0.5,
        summary: "Demo evidence item"
      }],
      category: 'other' as const
    }

    // Create verification record
    const verification = new Verification({
      userId: session.user.id,
      claim,
      claimType,
      verdict: mockVerification.verdict,
      confidence: mockVerification.confidence,
      explanation: mockVerification.explanation,
      reasoning: mockVerification.reasoning,
      sourceCredibility: mockVerification.sourceCredibility,
      harmIndex: mockVerification.harmIndex,
      evidence: mockVerification.evidence,
      isPublic,
      category: mockVerification.category,
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        processingTime: Math.random() * 1000, // Mock processing time
        aiModel: 'demo-model-v1',
        sourceCount: 1
      }
    }) as IVerification

    await verification.save()

    return NextResponse.json({
      success: true,
      verificationId: verification._id.toString(),
      result: {
        claim: verification.claim,
        verdict: verification.verdict,
        confidence: verification.confidence,
        explanation: verification.explanation,
        reasoning: verification.reasoning,
        sourceCredibility: verification.sourceCredibility,
        harmIndex: verification.harmIndex,
        evidence: verification.evidence
      }
    })

  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const verificationId = searchParams.get('id')

    if (!verificationId) {
      return NextResponse.json(
        { error: "Verification ID is required" },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const verification = await Verification.findById(verificationId)
      .populate('userId', 'name')

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      )
    }

    // Check if verification is public or user owns it
    const isOwner = session?.user?.id === verification.userId._id.toString()
    const canView = verification.isPublic || isOwner

    if (!canView) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Increment view count if not the owner
    if (!isOwner) {
      await Verification.findByIdAndUpdate(verificationId, {
        $inc: { views: 1 }
      })
    }

    return NextResponse.json({
      claim: verification.claim,
      verdict: verification.verdict,
      confidence: verification.confidence,
      explanation: verification.explanation,
      reasoning: verification.reasoning,
      sourceCredibility: verification.sourceCredibility,
      harmIndex: verification.harmIndex,
      evidence: verification.evidence,
      createdAt: verification.createdAt,
      views: verification.views,
      isOwner
    })

  } catch (error) {
    console.error("Get verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}