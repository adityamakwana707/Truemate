import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongoose"
import { User } from "@/lib/models"
import type { IUser } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Create new user (password will be hashed automatically by the pre-save hook)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    }) as IUser

    // Save user to database
    await newUser.save()
    
    // Remove password from response for security
    const userResponse = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email
    }

    console.log("New user registered:", { 
      id: newUser._id, 
      name: newUser.name, 
      email: newUser.email 
    })

    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      console.error("Validation error details:", error.message)
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }

    // Handle duplicate key errors (MongoDB duplicate email)
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Handle other mongoose errors
    if (error instanceof Error && error.name === 'MongoError') {
      console.error("MongoDB error:", error.message)
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}