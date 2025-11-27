import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { connectToDatabase } from "@/lib/mongoose"
import { User as UserModel } from "@/lib/models"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await connectToDatabase()
          
          // Find user by email and include password for comparison
          const user = await UserModel.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

          // Compare password
          const isValidPassword = await user.comparePassword(credentials.password)
          
          if (!isValidPassword) {
            console.log("Invalid password for user:", credentials.email)
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: null
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    // Remove signUp as NextAuth doesn't support custom signup pages
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // Disable debug to reduce console noise
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
export { authOptions }